"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Import modular components
import ProfileSidebar from "./profile/ProfileSidebar";
import CubeDevStats from "./profile/CubeDevStats";
import WCAStats from "./profile/WCAStats";

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
  // Add average data
  average?: number;
  average_world_ranking?: number;
  average_continental_ranking?: number;
  average_national_ranking?: number;
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

  // URL tab management
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || "cubedev";

  // Get current user
  const { user } = useUser();

  // Query CubeDev user data
  const cubeDevUsers = useQuery(api.users.getAllUsers);
  const cubeDevUser =
    cubeDevUsers?.find((user) => user.wcaId === wcaId) || null;

  // Check privacy settings
  const privacySettings = useQuery(api.users.isUserProfilePrivate, { wcaId });

  // Tab change handler
  const handleTabChange = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabName === "cubedev") {
      params.delete("tab");
    } else {
      params.set("tab", tabName);
    }
    router.push(pathname + (params.toString() ? "?" + params.toString() : ""));
  };

  useEffect(() => {
    if (cubeDevUsers === undefined || privacySettings === undefined) {
      return;
    }

    // Check if user is deleted first
    if (privacySettings?.isDeleted) {
      setIsLoading(false);
      setError("This user account is no longer available");
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
          `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
            },
          }
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
              // Add average data
              average: record.average?.best || 0,
              average_world_ranking: record.average?.world_ranking || 0,
              average_continental_ranking:
                record.average?.continental_ranking || 0,
              average_national_ranking: record.average?.national_ranking || 0,
            }))
            .filter((record) => record.best > 0 || record.average > 0);

          setPersonalRecords(records);
        }

        // Fetch competition results with better error handling
        try {
          setIsLoadingCompetitions(true);
          const resultsResponse = await fetch(
            `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}/results`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
              },
            }
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

            // Batch requests to avoid hitting rate limits
            for (let i = 0; i < uniqueCompetitionIds.length; i += 3) {
              const batch = uniqueCompetitionIds.slice(i, i + 3) as string[];
              const promises = batch.map(async (compId: string) => {
                try {
                  // Add delay to respect rate limits
                  await new Promise((resolve) => setTimeout(resolve, 100));

                  const response = await fetch(
                    `https://www.worldcubeassociation.org/api/v0/competitions/${compId}`,
                    {
                      headers: {
                        Accept: "application/json",
                        "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
                      },
                    }
                  );

                  if (response.ok) {
                    const data = await response.json();
                    return { compId, data };
                  } else {
                    console.warn(
                      `Failed to fetch competition ${compId}: ${response.status}`
                    );
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

              // Add longer delay between batches
              if (i + 3 < uniqueCompetitionIds.length) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
            }

            setCompetitionDetails(competitionDetailsMap);
          } else {
            console.warn(`Failed to fetch results: ${resultsResponse.status}`);
          }
        } catch (error) {
          console.warn("Failed to fetch competition results:", error);
        } finally {
          setIsLoadingCompetitions(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsLoading(false);
        setIsLoadingCompetitions(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (wcaId && cubeDevUsers !== undefined && privacySettings !== undefined) {
      if (cubeDevUser && !privacySettings?.isDeleted) {
        fetchWCAData();
      }
    }
  }, [wcaId, cubeDevUsers, cubeDevUser, privacySettings]);

  if (
    isLoading ||
    cubeDevUsers === undefined ||
    privacySettings === undefined
  ) {
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
      <div className="container-responsive py-6 max-w-7xl">
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Profile Information */}
          <div className="lg:w-80 lg:flex-shrink-0">
            <ProfileSidebar
              person={person}
              wcaId={wcaId}
              cubeDevUser={cubeDevUser}
              personalRecords={personalRecords}
            />
          </div>

          {/* Right Content - Tabbed Stats */}
          <div className="flex-1 min-w-0">
            {/* Tab Navigation */}
            <div className="border-b border-[var(--border)] mb-6">
              <nav className="flex space-x-8 overflow-x-auto">
                <button
                  onClick={() => handleTabChange("cubedev")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    currentTab === "cubedev"
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                  }`}
                >
                  CubeDev Stats
                </button>
                <button
                  onClick={() => handleTabChange("wca")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    currentTab === "wca"
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                  }`}
                >
                  WCA Stats
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {currentTab === "cubedev" && (
                <CubeDevStats wcaId={wcaId} cubeDevUserId={cubeDevUser?._id} />
              )}
              {currentTab === "wca" && (
                <WCAStats
                  wcaId={wcaId}
                  person={person}
                  personalRecords={personalRecords}
                  competitionResults={competitionResults}
                  competitionDetails={competitionDetails}
                  isLoadingCompetitions={isLoadingCompetitions}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}