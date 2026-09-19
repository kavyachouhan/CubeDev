import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { isWcaIdentifier, normalizeIdentifier } from "@/lib/identifier-utils";
import { getSessionFromRequest, getWcaAccessTokenFromRequest } from "@/lib/session";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { logger } from "@/lib/logger";
import { publicConfig, wcaEndpoints } from "@/lib/config";

const convex = new ConvexHttpClient(publicConfig.convexUrl);

type RegistrationStatus = "accepted" | "pending" | "waitlisted";

interface WcaCompetition {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  event_ids?: string[];
  competitor_limit?: number;
  registration_open?: string;
  registration_close?: string;
  url?: string;
  cancelled_at?: string;
}

interface RegisteredCompetition extends WcaCompetition {
  registrationStatus: RegistrationStatus;
}

interface WcaCompetitionsMineResponse {
  future_competitions?: WcaCompetition[];
  registrations_by_competition?: Record<string, string>;
}

interface WcaUserResponse {
  upcoming_competitions?: WcaCompetition[];
  user?: {
    upcoming_competitions?: WcaCompetition[];
  };
}

const WCA_DEFAULT_HEADERS = {
  Accept: "application/json",
  "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
};

const normalizeRegistrationStatus = (
  status: unknown,
): RegistrationStatus | null => {
  if (typeof status !== "string") {
    return null;
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "accepted") {
    return "accepted";
  }

  if (normalized === "pending") {
    return "pending";
  }

  if (normalized === "waitlisted" || normalized === "waiting_list") {
    return "waitlisted";
  }

  return null;
};

const mapCompetition = (
  competition: WcaCompetition,
  registrationStatus: RegistrationStatus,
): RegisteredCompetition | null => {
  if (
    !competition ||
    typeof competition.id !== "string" ||
    typeof competition.name !== "string" ||
    typeof competition.city !== "string" ||
    typeof competition.country_iso2 !== "string" ||
    typeof competition.start_date !== "string" ||
    typeof competition.end_date !== "string"
  ) {
    return null;
  }

  return {
    id: competition.id,
    name: competition.name,
    city: competition.city,
    country_iso2: competition.country_iso2,
    start_date: competition.start_date,
    end_date: competition.end_date,
    event_ids: competition.event_ids ?? [],
    competitor_limit: competition.competitor_limit,
    registration_open: competition.registration_open,
    registration_close: competition.registration_close,
    url: competition.url,
    cancelled_at: competition.cancelled_at,
    registrationStatus,
  };
};

const sortCompetitionsByStartDate = (a: WcaCompetition, b: WcaCompetition) =>
  a.start_date.localeCompare(b.start_date);

const fetchFromMineEndpoint = async (
  accessToken: string,
): Promise<RegisteredCompetition[] | null> => {
  const response = await fetchWithTimeout(
      `${wcaEndpoints.apiBaseUrl}/competitions/mine`,
    {
      timeoutMs: 10_000,
      headers: {
        ...WCA_DEFAULT_HEADERS,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as WcaCompetitionsMineResponse;
  const futureCompetitions = payload.future_competitions ?? [];
  const registrationsByCompetition = payload.registrations_by_competition ?? {};

  if (!Array.isArray(futureCompetitions)) {
    return null;
  }

  return futureCompetitions
    .map((competition) => {
      const status = normalizeRegistrationStatus(
        registrationsByCompetition[competition.id],
      );

      if (!status) {
        return null;
      }

      return mapCompetition(competition, status);
    })
    .filter(
      (competition): competition is RegisteredCompetition => !!competition,
    )
    .filter((competition) => !competition.cancelled_at)
    .sort(sortCompetitionsByStartDate);
};

const fetchFromPublicUserEndpoint = async (
  wcaUserId: number,
): Promise<RegisteredCompetition[] | null> => {
  const response = await fetchWithTimeout(
    `${wcaEndpoints.apiBaseUrl}/users/${wcaUserId}?upcoming_competitions=true`,
    {
      timeoutMs: 10_000,
      headers: WCA_DEFAULT_HEADERS,
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as WcaUserResponse;
  const upcomingCompetitions = Array.isArray(payload.upcoming_competitions)
    ? payload.upcoming_competitions
    : Array.isArray(payload.user?.upcoming_competitions)
      ? payload.user.upcoming_competitions
      : [];

  return upcomingCompetitions
    .map((competition) => mapCompetition(competition, "accepted"))
    .filter(
      (competition): competition is RegisteredCompetition => !!competition,
    )
    .filter((competition) => !competition.cancelled_at)
    .sort(sortCompetitionsByStartDate);
};

export async function GET(request: NextRequest) {
  try {
    const wcaId = request.nextUrl.searchParams.get("wcaId");

    if (!wcaId) {
      return NextResponse.json(
        { success: false, error: "WCA ID is required" },
        { status: 400 },
      );
    }

    const normalizedWcaId = normalizeIdentifier(wcaId);

    if (!isWcaIdentifier(normalizedWcaId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid WCA ID format. Please provide a valid WCA ID (e.g. 2015XXXX01).",
        },
        { status: 400 },
      );
    }

    const user = await convex.query(api.users.getUserByWcaId, {
      wcaId: normalizedWcaId,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const session = await getSessionFromRequest(request);
    const sessionWcaToken = getWcaAccessTokenFromRequest(request);
    if (
      session?.wcaId &&
      normalizeIdentifier(session.wcaId) === normalizedWcaId &&
      sessionWcaToken
    ) {
      const competitionsFromMine = await fetchFromMineEndpoint(
        decodeURIComponent(sessionWcaToken),
      );

      if (competitionsFromMine) {
        return NextResponse.json({
          success: true,
          competitions: competitionsFromMine,
        });
      }

      logger.warn("wca_mine_endpoint_failed", { wcaId: normalizedWcaId });
    }

    // Fallback source: accepted upcoming competitions from public endpoint.
    const competitionsFromPublic = await fetchFromPublicUserEndpoint(
      user.wcaUserId,
    );

    if (competitionsFromPublic) {
      return NextResponse.json({
        success: true,
        competitions: competitionsFromPublic,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch upcoming competitions from WCA API",
      },
      { status: 502 },
    );
  } catch (error) {
    logger.error("upcoming_competitions_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}