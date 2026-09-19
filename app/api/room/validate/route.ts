import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { publicConfig } from "@/lib/config";

const convex = new ConvexHttpClient(publicConfig.convexUrl);

export async function POST(request: NextRequest) {
  try {
    const { roomId } = await request.json();

    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Query the Convex backend to check if the room exists
    const roomDetails = await convex.query(api.challengeRooms.getRoomDetails, {
      roomId: roomId.trim().toUpperCase(),
    });

    return NextResponse.json({
      exists: roomDetails !== null,
      roomId: roomId.trim().toUpperCase(),
    });
  } catch (error) {
    console.error("Error validating room:", error);
    return NextResponse.json(
      { error: "Failed to validate room" },
      { status: 500 }
    );
  }
}