import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // WCA OAuth configuration
    const WCA_CLIENT_ID = process.env.WCA_CLIENT_ID;
    const WCA_CLIENT_SECRET = process.env.WCA_CLIENT_SECRET;
    const WCA_REDIRECT_URI = process.env.WCA_REDIRECT_URI;

    console.log("WCA OAuth Debug:", {
      hasClientId: !!WCA_CLIENT_ID,
      hasClientSecret: !!WCA_CLIENT_SECRET,
      hasRedirectUri: !!WCA_REDIRECT_URI,
      redirectUri: WCA_REDIRECT_URI,
    });

    if (!WCA_CLIENT_ID || !WCA_CLIENT_SECRET) {
      console.error("Missing WCA OAuth credentials:", {
        WCA_CLIENT_ID: !!WCA_CLIENT_ID,
        WCA_CLIENT_SECRET: !!WCA_CLIENT_SECRET,
      });
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://www.worldcubeassociation.org/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: WCA_CLIENT_ID,
          client_secret: WCA_CLIENT_SECRET,
          code: code,
          redirect_uri: WCA_REDIRECT_URI,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.json(
        { success: false, error: "Failed to exchange authorization code" },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch user information from WCA
    const userResponse = await fetch(
      "https://www.worldcubeassociation.org/api/v0/me",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error("Failed to fetch user data from WCA");
      return NextResponse.json(
        { success: false, error: "Failed to fetch user information" },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();

    // Debug log to see what data we're getting from WCA
    console.log("WCA User Data:", JSON.stringify(userData, null, 2));

    // Save user data to Convex database
    try {
      const userDataForConvex: any = {
        wcaId: userData.me.wca_id || `temp_${userData.me.id}`, // Handle users without WCA ID
        wcaUserId: userData.me.id,
        name: userData.me.name,
        countryIso2: userData.me.country_iso2,
        avatar: userData.me.avatar?.url || undefined,
        accessToken: tokenData.access_token,
        dateOfBirth: userData.me.date_of_birth || undefined,
        gender: userData.me.gender || undefined,
        region: userData.me.region || undefined,
      };

      // Only add email if it exists in the response
      if (userData.me.email) {
        userDataForConvex.email = userData.me.email;
      }

      const userId = await convex.mutation(
        api.users.upsertUser,
        userDataForConvex
      );

      // Return success with user data including Convex user ID
      return NextResponse.json({
        success: true,
        user: {
          id: userData.me.id,
          convexId: userId,
          name: userData.me.name,
          wcaId: userData.me.wca_id,
          countryIso2: userData.me.country_iso2,
          avatar: userData.me.avatar,
          email: userData.me.email,
        },
        accessToken: tokenData.access_token,
      });
    } catch (convexError) {
      console.error("Failed to save user to Convex:", convexError);
      // Still return success but log the database error
      return NextResponse.json({
        success: true,
        user: {
          id: userData.me.id,
          name: userData.me.name,
          wcaId: userData.me.wca_id,
          countryIso2: userData.me.country_iso2,
          avatar: userData.me.avatar,
          email: userData.me.email,
        },
        accessToken: tokenData.access_token,
        warning: "User authenticated but not saved to database",
      });
    }
  } catch (error) {
    console.error("WCA OAuth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
