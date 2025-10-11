"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Import modular components
import ProfileSidebar from "./profile/ProfileSidebar";
import CubeDevStats from "./profile/CubeDevStats";
import WCAStats from "./profile/WCAStats";
import { ProfileSidebarSkeleton } from "./SkeletonLoaders";

// Import cache utilities
import { getFromCache, saveToCache, WCA_CACHE_KEYS } from "@/lib/wca-cache";

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
  const [shouldLoadCompetitions, setShouldLoadCompetitions] = useState(false);

  // Use ref to track if competitions have been loaded to prevent re-fetching
  const competitionsLoadedRef = useRef(false);

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

    // Trigger competition details loading when WCA tab is opened
    if (tabName === "wca" && !shouldLoadCompetitions) {
      setShouldLoadCompetitions(true);
    }
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

        // Try to get profile from cache first
        const cachedProfile = getFromCache<WCAProfileData>(
          WCA_CACHE_KEYS.profile(wcaId)
        );
        const cachedResults = getFromCache<WCACompetitionResult[]>(
          WCA_CACHE_KEYS.results(wcaId)
        );

        if (cachedProfile) {
          setProfileData(cachedProfile);
          // Extract personal records from cached profile
          if (cachedProfile.person.personal_records) {
            const records: WCAPersonalRecord[] = Object.entries(
              cachedProfile.person.personal_records
            )
              .map(([eventId, record]: [string, any]) => ({
                event_id: eventId,
                best: record.single?.best || 0,
                world_ranking: record.single?.world_ranking || 0,
                continental_ranking: record.single?.continental_ranking || 0,
                national_ranking: record.single?.national_ranking || 0,
                average: record.average?.best || 0,
                average_world_ranking: record.average?.world_ranking || 0,
                average_continental_ranking:
                  record.average?.continental_ranking || 0,
                average_national_ranking: record.average?.national_ranking || 0,
              }))
              .filter((record) => record.best > 0 || record.average > 0);

            setPersonalRecords(records);
          }
        }

        if (cachedResults) {
          setCompetitionResults(cachedResults);
        }

        // If we have cached data, show it immediately but still fetch fresh data in background
        if (cachedProfile && cachedResults) {
          setIsLoading(false);
        }

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

        // Cache the profile data
        saveToCache(WCA_CACHE_KEYS.profile(wcaId), profileData);

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

            // Cache the results data
            saveToCache(WCA_CACHE_KEYS.results(wcaId), resultsData || []);
          } else {
            console.warn(`Failed to fetch results: ${resultsResponse.status}`);
          }
        } catch (error) {
          console.warn("Failed to fetch competition results:", error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsLoading(false);
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

  // Separate effect for loading competition details lazily when WCA tab is viewed
  useEffect(() => {
    // Prevent re-running if already loaded
    if (competitionsLoadedRef.current) {
      return;
    }

    if (
      !shouldLoadCompetitions ||
      !competitionResults ||
      isLoadingCompetitions ||
      competitionResults.length === 0
    ) {
      return;
    }

    // Prevent re-running if we already have competition details loaded
    if (competitionDetails.size > 0) {
      competitionsLoadedRef.current = true;
      setIsLoadingCompetitions(false);
      return;
    }

    const fetchCompetitionDetails = async () => {
      try {
        setIsLoadingCompetitions(true);

        // Fetch competition details for each unique competition
        const uniqueCompetitionIds = Array.from(
          new Set(
            (competitionResults || []).map(
              (r: WCACompetitionResult) => r.competition_id
            )
          )
        );

        const competitionDetailsMap = new Map<string, CompetitionInfo>();

        // Check cache for each competition first
        const uncachedCompIds: string[] = [];
        uniqueCompetitionIds.forEach((compId) => {
          const cached = getFromCache<CompetitionInfo>(
            WCA_CACHE_KEYS.competition(compId)
          );
          if (cached) {
            competitionDetailsMap.set(compId, cached);
          } else {
            uncachedCompIds.push(compId);
          }
        });

        // If we have some cached data, update state immediately
        if (competitionDetailsMap.size > 0) {
          setCompetitionDetails(new Map(competitionDetailsMap));
        }

        // If all competitions are cached, we're done
        if (uncachedCompIds.length === 0) {
          competitionsLoadedRef.current = true;
          setIsLoadingCompetitions(false);
          return;
        }

        // Batch requests to avoid hitting rate limits (only for uncached items)
        for (let i = 0; i < uncachedCompIds.length; i += 3) {
          const batch = uncachedCompIds.slice(i, i + 3) as string[];
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
              const compInfo: CompetitionInfo = {
                id: result.data.id,
                name: result.data.name,
                start_date: result.data.start_date,
                end_date: result.data.end_date,
                city: result.data.city,
                venue: result.data.venue,
                country_iso2: result.data.country_iso2,
                events: result.data.event_ids || [],
                bestResult: 999,
                mainEvent: undefined,
              };
              competitionDetailsMap.set(result.compId, compInfo);

              // Cache each competition
              saveToCache(WCA_CACHE_KEYS.competition(result.compId), compInfo);
            }
          });

          // Update state after each batch
          setCompetitionDetails(new Map(competitionDetailsMap));

          // Add longer delay between batches
          if (i + 3 < uncachedCompIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // Final update with all competitions
        setCompetitionDetails(competitionDetailsMap);

        // Mark as loaded to prevent re-fetching
        competitionsLoadedRef.current = true;
      } catch (error) {
        console.warn("Failed to fetch competition details:", error);
      } finally {
        setIsLoadingCompetitions(false);
      }
    };

    fetchCompetitionDetails();
  }, [shouldLoadCompetitions, competitionResults]);

  // Check if WCA tab is already active on mount
  useEffect(() => {
    if (currentTab === "wca" && !shouldLoadCompetitions) {
      setShouldLoadCompetitions(true);
    }
  }, [currentTab]);

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
    // Show skeleton loader while loading
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[var(--background)]">
          <div className="container-responsive py-6 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-80 lg:flex-shrink-0">
                <ProfileSidebarSkeleton />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-12 bg-[var(--surface-elevated)] rounded-lg w-full mb-6" />
                <div className="space-y-8">
                  <div className="h-64 bg-[var(--surface-elevated)] rounded-lg" />
                  <div className="h-48 bg-[var(--surface-elevated)] rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
