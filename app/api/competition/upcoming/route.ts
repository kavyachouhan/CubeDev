import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const WCA_PERSON_ID_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const wcaId = request.nextUrl.searchParams.get("wcaId");

    if (!wcaId) {
      return NextResponse.json(
        { success: false, error: "WCA ID is required" },
        { status: 400 },
      );
    }

    if (!WCA_PERSON_ID_REGEX.test(wcaId.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Link a valid WCA ID in Settings to access this feature",
        },
        { status: 400 },
      );
    }

    // Get user from Convex to get wcaUserId
    const user = await convex.query(api.users.getUserByWcaId, { wcaId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Try to fetch using the public users endpoint first (uses wcaUserId)
    // This endpoint includes upcoming_competitions without requiring authentication
    const publicResponse = await fetch(
      `https://www.worldcubeassociation.org/api/v0/users/${user.wcaUserId}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
        },
      },
    );

    if (publicResponse.ok) {
      const publicData = await publicResponse.json();
      // The users endpoint returns user data directly with upcoming_competitions
      const upcomingCompetitions = publicData.user?.upcoming_competitions || [];

      return NextResponse.json({
        success: true,
        competitions: upcomingCompetitions,
      });
    }

    // If public endpoint fails and we have an access token, try authenticated /me endpoint
    if (user.accessToken) {
      const wcaResponse = await fetch(
        "https://www.worldcubeassociation.org/api/v0/me",
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      if (wcaResponse.ok) {
        const wcaData = await wcaResponse.json();
        const upcomingCompetitions = wcaData.me?.upcoming_competitions || [];

        return NextResponse.json({
          success: true,
          competitions: upcomingCompetitions,
        });
      }

      // If both fail, return appropriate error
      if (wcaResponse.status === 401) {
        // Token expired but public API also failed - this shouldn't normally happen
        console.warn(
          "Both public and authenticated WCA API requests failed for user:",
          wcaId,
        );
      }
    }

    // Both endpoints failed
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch upcoming competitions from WCA API",
      },
      { status: 502 },
    );
  } catch (error) {
    console.error("Error fetching upcoming competitions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
