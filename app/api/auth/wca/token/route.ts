import { NextRequest, NextResponse } from "next/server";

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

    if (!WCA_CLIENT_ID || !WCA_CLIENT_SECRET) {
      console.error("Missing WCA OAuth credentials");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://www.worldcubeassociation.org/oauth/token", {
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
    });

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
    const userResponse = await fetch("https://www.worldcubeassociation.org/api/v0/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch user data from WCA");
      return NextResponse.json(
        { success: false, error: "Failed to fetch user information" },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();

    // Return success with user data
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
    });

  } catch (error) {
    console.error("WCA OAuth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}