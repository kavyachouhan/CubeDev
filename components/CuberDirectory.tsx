"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  Search,
  Users,
  Globe,
  MapPin,
  ExternalLink,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const USERS_PER_PAGE = 12;

export default function CuberDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const { user } = useUser();

  const directoryPage = useQuery(api.users.getAllUsers, {
    limit: USERS_PER_PAGE,
    cursor: pageCursors[currentPage - 1] ?? undefined,
    search: searchTerm.trim() || undefined,
  });

  const cubeDevUsers = (directoryPage?.users ?? []).flatMap((entry) =>
    entry ? [entry] : [],
  );
  const hasNextPage = directoryPage ? !directoryPage.isDone : false;
  const paginatedUsers = cubeDevUsers;

  useEffect(() => {
    if (!directoryPage?.cursor || directoryPage.isDone) {
      return;
    }
    setPageCursors((prev) => {
      const next = [...prev];
      next[currentPage] = directoryPage.cursor;
      return next;
    });
  }, [directoryPage, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    setPageCursors([null]);
  };

  // Avatar component for consistent circular display
  const UserAvatar = ({
    user,
    size = 48,
    className = "",
  }: {
    user: { name: string; avatar?: string };
    size?: number;
    className?: string;
  }) => {
    const [imageError, setImageError] = useState(false);

    if (user.avatar && !imageError) {
      return (
        <div
          className={`relative rounded-full overflow-hidden border-2 border-(--border) shrink-0 ${className}`}
          style={{ width: size, height: size }}
        >
          <Image
            src={user.avatar}
            alt={`${user.name}'s avatar`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div
        className={`rounded-full flex items-center justify-center bg-(--primary)/10 border-2 border-(--border) shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {user.avatar && imageError ? (
          <User className="w-1/2 h-1/2 text-(--primary)" />
        ) : (
          <span
            className="font-bold text-(--primary)"
            style={{ fontSize: size * 0.4 }}
          >
            {user.name.charAt(0)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-(--background)">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-5xl font-bold text-(--text-primary) font-statement">
              Cubers <span className="text-(--primary)">Directory</span>
            </h1>
          </div>
          <p className="text-(--text-secondary) md:text-2xl max-w-2xl mx-auto font-inter">
            Connect with the CubeDev community. Browse profiles and statistics
            of registered members.
          </p>
        </div>

        {/* Search */}
        <div className="timer-card mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-(--text-muted)" />
            <input
              type="text"
              placeholder="Search by name, WCA ID, CubeDev ID, or country..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--primary) transition-colors font-inter"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="timer-card text-center">
            <Users className="w-8 h-8 text-(--primary) mx-auto mb-3" />
            <div className="text-2xl font-bold text-(--text-primary) font-mono">
              {directoryPage === undefined ? "…" : cubeDevUsers.length}
              {hasNextPage ? "+" : ""}
            </div>
            <div className="text-(--text-secondary) font-inter">
              Active Cubers
            </div>
          </div>

          <div className="timer-card text-center">
            <Globe className="w-8 h-8 text-(--primary) mx-auto mb-3" />
            <div className="text-2xl font-bold text-(--text-primary) font-mono">
              {new Set(cubeDevUsers.map((u) => u.countryIso2)).size || 0}
            </div>
            <div className="text-(--text-secondary) font-inter">Countries</div>
          </div>
        </div>

        {/* Results Summary */}
        {paginatedUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-(--text-secondary) font-inter">
              Showing {paginatedUsers.length} cubers
              {searchTerm && <span> matching &quot;{searchTerm}&quot;</span>}
              {hasNextPage && <span> (more available)</span>}
            </p>
          </div>
        )}

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <Link
                key={user._id}
                href={`/cuber/${user.wcaId}`}
                className="timer-card hover:border-(--primary) transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar
                    user={user}
                    size={48}
                    className="group-hover:border-(--primary) transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-(--text-primary) font-statement group-hover:text-(--primary) transition-colors truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
                      <span className="font-mono">{user.wcaId}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
                    <MapPin className="w-4 h-4" />
                    <span className="font-inter">{user.countryIso2}</span>
                  </div>

                  <div className="text-xs text-(--text-muted) font-inter">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          ) : searchTerm ? (
            <div className="col-span-full timer-card text-center py-8">
              <Search className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-statement">
                No cubers found
              </h3>
              <p className="text-(--text-secondary) font-inter">
                Try adjusting your search terms or browse all cubers.
              </p>
            </div>
          ) : (
            <div className="col-span-full timer-card text-center py-8">
              <Users className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-statement">
                Loading cubers...
              </h3>
              <p className="text-(--text-secondary) font-inter">
                Discovering the speedcubing community.
              </p>
            </div>
          )}
        </div>

        {(currentPage > 1 || hasNextPage) && (
          <div className="timer-card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 border border-(--border) hover:border-(--primary) text-(--text-primary) rounded-lg transition-all duration-200 font-statement font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">PREVIOUS</span>
              </button>

              <p className="text-sm text-(--text-muted) font-inter">
                Page {currentPage}
              </p>

              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
                className="flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 border border-(--border) hover:border-(--primary) text-(--text-primary) rounded-lg transition-all duration-200 font-statement font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Call to Action for Non-Users */}
        {!user && (
          <div className="timer-card mt-8 text-center">
            <h3 className="text-xl font-bold text-(--text-primary) mb-4 font-statement">
              Join the <span className="text-(--primary)">Community</span>
            </h3>
            <p className="text-(--text-secondary) mb-6 font-inter">
              Connect your WCA account to appear in the directory and showcase
              your cubing achievements.
            </p>
            <Link href="/" className="btn-primary font-button">
              Get Started with CubeDev
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}