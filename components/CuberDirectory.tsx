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
  Trophy,
  ExternalLink,
  ArrowRight,
  User,
} from "lucide-react";

interface CubeDevUser {
  _id: string;
  name: string;
  wcaId: string;
  countryIso2: string;
  createdAt: number;
  avatar?: string;
}

export default function CuberDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();

  // Get all CubeDev users (you might want to add pagination later)
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

  // Avatar component for consistent display
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
          className={`rounded-lg object-cover border-2 border-[var(--border)] ${className}`}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div
        className={`rounded-lg flex items-center justify-center text-white ${className}`}
        style={{ width: size, height: size }}
      >
        {user.avatar && imageError ? (
          <User className="w-1/2 h-1/2" />
        ) : (
          <span className="font-bold" style={{ fontSize: size * 0.4 }}>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors font-inter"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          <div className="timer-card text-center">
            <Trophy className="w-8 h-8 text-[var(--primary)] mx-auto mb-3" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              WCA
            </div>
            <div className="text-[var(--text-secondary)] font-inter">
              Verified
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: CubeDevUser) => (
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