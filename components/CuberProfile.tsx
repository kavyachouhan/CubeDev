"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2, AlertCircle } from "lucide-react";

// Import modular components
import ProfileHeader from "./profile/ProfileHeader";
import ProfileStats from "./profile/ProfileStats";
import WCARecords from "./profile/WCARecords";
import CompetitionList from "./profile/CompetitionList";

interface CuberProfileProps {
  wcaId: string;
}

interface WCAProfileData {
  person: {
    name: string;
    wcaId: string;
    avatar?: {
      url: string;
    };
    country: {
      name: string;
      iso2: string;
    };
    gender: string;
    class: string;
    delegate_status?: string;
    teams?: string[];
    personal_records?: Record<string, any>;
  };
}

interface WCACompetitionResult {
  id: number;
  pos: number;
  best: number;
  average: number;
  competition_id: string;
  event_id: string;
  regional_single_record?: string;
  regional_average_record?: string;
  national_single_record?: string;
  national_average_record?: string;
  world_single_record?: string;
  world_average_record?: string;
}

interface WCAPersonalRecord {
  event_id: string;
  best: number;
  world_ranking: number;
  continental_ranking: number;
  national_ranking: number;
}

interface CompetitionInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city?: string;
  venue?: string;
  country_iso2: string;
  events: string[];
  bestResult: number;
  mainEvent?: string;
}

export default function CuberProfile({ wcaId }: CuberProfileProps) {
  const [profileData, setProfileData] = useState<WCAProfileData | null>(null);
  const [personalRecords, setPersonalRecords] = useState<
    WCAPersonalRecord[] | null
  >(null);
  const [competitionResults, setCompetitionResults] = useState<
    WCACompetitionResult[] | null
  >(null);
  const [competitionDetails, setCompetitionDetails] = useState<
    Map<string, CompetitionInfo>
  >(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false);

  // Query CubeDev user data
  const cubeDevUsers = useQuery(api.users.getAllUsers);
  const cubeDevUser =
    cubeDevUsers?.find((user) => user.wcaId === wcaId) || null;

  useEffect(() => {
    if (cubeDevUsers === undefined) {
      return;
    }

    // Only fetch WCA data if user is registered on CubeDev
    if (!cubeDevUser) {
      setIsLoading(false);
      setError("This profile is private or user is not registered on CubeDev");
      return;
    }

    const fetchWCAData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch basic profile data
        const profileResponse = await fetch(
          `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`
        );

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            throw new Error("WCA profile not found");
          }
          throw new Error("Failed to fetch WCA profile");
        }

        const profileData = await profileResponse.json();
        setProfileData(profileData);

        // Extract personal records
        if (profileData.person.personal_records) {
          const records: WCAPersonalRecord[] = Object.entries(
            profileData.person.personal_records
          )
            .map(([eventId, record]: [string, any]) => ({
              event_id: eventId,
              best: record.single?.best || 0,
              world_ranking: record.single?.world_ranking || 0,
              continental_ranking: record.single?.continental_ranking || 0,
              national_ranking: record.single?.national_ranking || 0,
            }))
            .filter((record) => record.best > 0);

          setPersonalRecords(records);
        }

        // Fetch competition results
        setIsLoadingCompetitions(true);
        const resultsResponse = await fetch(
          `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}/results`
        );

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          setCompetitionResults(resultsData || []);

          // Fetch competition details for each unique competition
          const uniqueCompetitionIds = Array.from(
            new Set(
              (resultsData || []).map(
                (r: WCACompetitionResult) => r.competition_id
              )
            )
          );

          const competitionDetailsMap = new Map<string, CompetitionInfo>();

          // Fetch competition details in batches to avoid rate limiting
          for (let i = 0; i < uniqueCompetitionIds.length; i += 5) {
            const batch = uniqueCompetitionIds.slice(i, i + 5) as string[];
            const promises = batch.map(async (compId: string) => {
              try {
                const response = await fetch(
                  `https://www.worldcubeassociation.org/api/v0/competitions/${compId}`
                );
                if (response.ok) {
                  const data = await response.json();
                  return { compId, data };
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch details for competition ${compId}:`,
                  error
                );
              }
              return null;
            });

            const results = await Promise.all(promises);
            results.forEach((result) => {
              if (result && result.data) {
                competitionDetailsMap.set(result.compId, {
                  id: result.data.id,
                  name: result.data.name,
                  start_date: result.data.start_date,
                  end_date: result.data.end_date,
                  city: result.data.city,
                  venue: result.data.venue,
                  country_iso2: result.data.country_iso2,
                  events: result.data.event_ids || [],
                  bestResult: 999, // Will be updated with actual results
                  mainEvent: undefined,
                });
              }
            });

            // Add delay between batches to respect rate limits
            if (i + 5 < uniqueCompetitionIds.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          setCompetitionDetails(competitionDetailsMap);
        }

        setIsLoadingCompetitions(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsLoading(false);
        setIsLoadingCompetitions(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (wcaId && cubeDevUsers !== undefined) {
      if (cubeDevUser) {
        fetchWCAData();
      }
    }
  }, [wcaId, cubeDevUsers, cubeDevUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] font-inter">
            Loading cuber profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isPrivacyError =
      error.includes("private") || error.includes("not registered");

    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            {isPrivacyError ? "Profile Private" : "Profile Not Found"}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6 font-inter">
            {isPrivacyError
              ? "This cuber's profile is private. Only registered CubeDev members can view their competition data."
              : error}
          </p>
          {isPrivacyError && (
            <p className="text-[var(--text-muted)] text-sm font-inter">
              Want to join CubeDev? Sign up to connect with the cubing community
              and share your progress!
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.person) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] font-inter">
            No profile data available.
          </p>
        </div>
      </div>
    );
  }

  const { person } = profileData;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header with Member Info */}
        <ProfileHeader
          person={person}
          wcaId={wcaId}
          cubeDevUser={
            cubeDevUser
              ? {
                  createdAt: new Date(cubeDevUser._creationTime).toISOString(),
                  lastActive: cubeDevUser.lastLoginAt,
                }
              : undefined
          }
        />

        {/* Statistics Overview */}
        <ProfileStats
          personalRecords={personalRecords}
          competitionResults={competitionResults}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* WCA Personal Records */}
            <WCARecords personalRecords={person?.personal_records} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Competition History with Main Events */}
            <CompetitionList
              competitionResults={competitionResults}
              competitionDetails={competitionDetails}
              isLoadingCompetitions={isLoadingCompetitions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}