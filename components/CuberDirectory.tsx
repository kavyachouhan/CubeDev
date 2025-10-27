"use client";

import { useState } from "react";
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

interface CubeDevUser {
  _id: string;
  name: string;
  wcaId: string;
  countryIso2: string;
  createdAt: number;
  avatar?: string;
}

const USERS_PER_PAGE = 12;

export default function CuberDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUser();

  // Get all CubeDev users
  const cubeDevUsers = useQuery(api.users.getAllUsers, {}) as
    | CubeDevUser[]
    | undefined;

  const filteredUsers =
    cubeDevUsers?.filter(
      (user: CubeDevUser) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.wcaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.countryIso2.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Avatar component for consistent circular display
  const UserAvatar = ({
    user,
    size = 48,
    className = "",
  }: {
    user: CubeDevUser;
    size?: number;
    className?: string;
  }) => {
    const [imageError, setImageError] = useState(false);

    if (user.avatar && !imageError) {
      return (
        <Image
          src={user.avatar}
          alt={`${user.name}'s avatar`}
          width={size}
          height={size}
          className={`rounded-full object-cover border-2 border-[var(--border)] ${className}`}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div
        className={`rounded-full flex items-center justify-center bg-[var(--primary)]/10 border-2 border-[var(--border)] ${className}`}
        style={{ width: size, height: size }}
      >
        {user.avatar && imageError ? (
          <User className="w-1/2 h-1/2 text-[var(--primary)]" />
        ) : (
          <span
            className="font-bold text-[var(--primary)]"
            style={{ fontSize: size * 0.4 }}
          >
            {user.name.charAt(0)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] font-statement">
              Cubers <span className="text-[var(--primary)]">Directory</span>
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] md:text-2xl max-w-2xl mx-auto font-inter">
            Connect with the CubeDev community. Browse profiles and statistics
            of registered members.
          </p>
        </div>

        {/* Search */}
        <div className="timer-card mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, WCA ID, or country..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors font-inter"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="timer-card text-center">
            <Users className="w-8 h-8 text-[var(--primary)] mx-auto mb-3" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {cubeDevUsers?.length || 0}
            </div>
            <div className="text-[var(--text-secondary)] font-inter">
              Active Cubers
            </div>
          </div>

          <div className="timer-card text-center">
            <Globe className="w-8 h-8 text-[var(--primary)] mx-auto mb-3" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {new Set(cubeDevUsers?.map((u: CubeDevUser) => u.countryIso2))
                .size || 0}
            </div>
            <div className="text-[var(--text-secondary)] font-inter">
              Countries
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {filteredUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-[var(--text-secondary)] font-inter">
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredUsers.length)} of{" "}
              {filteredUsers.length} cubers
              {searchTerm && <span> matching "{searchTerm}"</span>}
            </p>
          </div>
        )}

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user: CubeDevUser) => (
              <Link
                key={user._id}
                href={`/cuber/${user.wcaId}`}
                className="timer-card hover:border-[var(--primary)] transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar
                    user={user}
                    size={48}
                    className="group-hover:border-[var(--primary)] transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] font-statement group-hover:text-[var(--primary)] transition-colors truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="font-mono">{user.wcaId}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <MapPin className="w-4 h-4" />
                    <span className="font-inter">{user.countryIso2}</span>
                  </div>

                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))
          ) : searchTerm ? (
            <div className="col-span-full timer-card text-center py-8">
              <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 font-statement">
                No cubers found
              </h3>
              <p className="text-[var(--text-secondary)] font-inter">
                Try adjusting your search terms or browse all cubers.
              </p>
            </div>
          ) : (
            <div className="col-span-full timer-card text-center py-8">
              <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 font-statement">
                Loading cubers...
              </h3>
              <p className="text-[var(--text-secondary)] font-inter">
                Discovering the speedcubing community.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="timer-card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-statement font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">PREVIOUS</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 h-10 rounded-lg font-statement font-medium transition-all duration-200 ${
                        currentPage === pageNumber
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-[var(--text-muted)]">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] font-statement font-medium transition-all duration-200"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-statement font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-[var(--text-muted)] font-inter">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          </div>
        )}

        {/* Call to Action for Non-Users */}
        {!user && (
          <div className="timer-card mt-8 text-center">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 font-statement">
              Join the <span className="text-[var(--primary)]">Community</span>
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 font-inter">
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