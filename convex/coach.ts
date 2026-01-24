import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get coach profile for a user
export const getCoachProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Create or update coach profile (onboarding)
export const saveCoachProfile = mutation({
  args: {
    userId: v.id("users"),
    currentAverage: v.optional(v.number()),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    ),
    primaryEvent: v.string(),
    goalType: v.union(
      v.literal("sub-60"),
      v.literal("sub-45"),
      v.literal("sub-30"),
      v.literal("sub-20"),
      v.literal("sub-15"),
      v.literal("sub-12"),
      v.literal("sub-10"),
      v.literal("sub-8"),
      v.literal("competition-ready"),
      v.literal("custom")
    ),
    customGoalTime: v.optional(v.number()),
    targetDate: v.number(),
    dailyPracticeMinutes: v.number(),
    practiceSchedule: v.optional(v.array(v.string())),
    baselineSessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if profile exists
    const existing = await ctx.db
      .query("coachProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        ...args,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("coachProfiles", {
        ...args,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get active training plan for user
export const getActiveTrainingPlan = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
  },
});

// Get all training plans for user
export const getTrainingPlans = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Generate weekly training plan
export const generateTrainingPlan = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error("Coach profile not found");
    
    const now = Date.now();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;
    
    // Mark any existing active plans as completed
    const existingActive = await ctx.db
      .query("coachTrainingPlans")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
    
    for (const plan of existingActive) {
      await ctx.db.patch(plan._id, { status: "completed", updatedAt: now });
    }
    
    // Generate daily plans based on profile
    const dailyPlans = generateDailyPlans(
      profile.skillLevel,
      profile.goalType,
      profile.dailyPracticeMinutes,
      profile.practiceSchedule,
      startOfWeek
    );
    
    const planId = await ctx.db.insert("coachTrainingPlans", {
      userId: args.userId,
      profileId: args.profileId,
      weekNumber: args.weekNumber,
      weekStartDate: startOfWeek,
      weekEndDate: endOfWeek,
      status: "active",
      dailyPlans,
      completedDays: 0,
      totalDays: dailyPlans.filter(d => !d.isRestDay).length,
      createdAt: now,
      updatedAt: now,
    });
    
    return planId;
  },
});

// Update activity completion status
export const updateActivityCompletion = mutation({
  args: {
    planId: v.id("coachTrainingPlans"),
    dayIndex: v.number(),
    activityIndex: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Training plan not found");
    
    const now = Date.now();
    const dailyPlans = [...plan.dailyPlans];
    const day = { ...dailyPlans[args.dayIndex] };
    const activities = [...day.activities];
    
    activities[args.activityIndex] = {
      ...activities[args.activityIndex],
      completed: args.completed,
      completedAt: args.completed ? now : undefined,
    };
    
    day.activities = activities;
    day.isCompleted = activities.every(a => a.completed);
    dailyPlans[args.dayIndex] = day;
    
    const completedDays = dailyPlans.filter(d => d.isCompleted && !d.isRestDay).length;
    
    await ctx.db.patch(args.planId, {
      dailyPlans,
      completedDays,
      updatedAt: now,
    });
  },
});

// Get journal entries for user
export const getJournalEntries = query({
  args: { 
    userId: v.id("users"), 
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    const entries = await query.collect();
    
    // Filter by date range if provided
    let filtered = entries;
    if (args.startDate || args.endDate) {
      filtered = entries.filter(e => {
        if (args.startDate && e.entryDate < args.startDate) return false;
        if (args.endDate && e.entryDate > args.endDate) return false;
        return true;
      });
    }
    
    if (args.limit) {
      return filtered.slice(0, args.limit);
    }
    return filtered;
  },
});

// Get journal entry for a specific date
export const getJournalEntryByDate = query({
  args: { userId: v.id("users"), date: v.number() },
  handler: async (ctx, args) => {
    const startOfDay = getStartOfDay(args.date);
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    
    const entries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    
    return entries.find(e => e.entryDate >= startOfDay && e.entryDate <= endOfDay) || null;
  },
});

// Create or update journal entry
export const saveJournalEntry = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    planId: v.optional(v.id("coachTrainingPlans")),
    entryDate: v.number(),
    linkedSessionId: v.optional(v.id("sessions")),
    solveCount: v.optional(v.number()),
    sessionAverage: v.optional(v.number()),
    bestSingle: v.optional(v.number()),
    practiceMinutes: v.optional(v.number()),
    mood: v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("okay"),
      v.literal("frustrated"),
      v.literal("tired")
    ),
    wentWell: v.optional(v.string()),
    challenges: v.optional(v.string()),
    notes: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
    completedActivities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startOfDay = getStartOfDay(args.entryDate);
    
    // Check if entry exists for this date
    const entries = await ctx.db
      .query("coachJournalEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    
    const existing = entries.find(e => {
      const entryStartOfDay = getStartOfDay(e.entryDate);
      return entryStartOfDay === startOfDay;
    });
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("coachJournalEntries", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get progress snapshots
export const getProgressSnapshots = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("coachProgressSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Create progress snapshot
export const createProgressSnapshot = mutation({
  args: {
    userId: v.id("users"),
    profileId: v.id("coachProfiles"),
    weekNumber: v.number(),
    averageTime: v.number(),
    bestSingle: v.optional(v.number()),
    bestAo5: v.optional(v.number()),
    bestAo12: v.optional(v.number()),
    totalSolves: v.number(),
    totalPracticeMinutes: v.number(),
    journalEntries: v.number(),
    progressPercentage: v.number(),
    onTrack: v.boolean(),
    aiInsights: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("coachProgressSnapshots", {
      ...args,
      snapshotDate: now,
      createdAt: now,
    });
  },
});

// Get user sessions for selection
export const getUserSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get user sessions with 3x3 solve counts for coach selection
export const getUserSessionsWith3x3Stats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Get 3x3 solve counts for each session
    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const solves = await ctx.db
          .query("solves")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();
        
        // Filter to only 3x3 solves
        const solves3x3 = solves.filter(s => s.event === "333");
        
        return {
          ...session,
          solveCount3x3: solves3x3.length,
        };
      })
    );
    
    return sessionsWithStats;
  },
});

// Get session stats for baseline calculation (3x3 only)
export const getSessionStats = query({
  args: { sessionId: v.id("sessions"), event: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const eventFilter = args.event || "333"; // Default to 3x3
    
    const solves = await ctx.db
      .query("solves")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    
    // Filter by event (default to 3x3)
    const eventSolves = solves.filter(s => s.event === eventFilter);
    
    if (eventSolves.length === 0) {
      return null;
    }
    
    const validSolves = eventSolves.filter(s => s.penalty !== "DNF" && isFinite(s.finalTime));
    
    if (validSolves.length === 0) {
      return { solveCount: eventSolves.length, average: null, bestSingle: null };
    }
    
    const times = validSolves.map(s => s.finalTime);
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const bestSingle = Math.min(...times);
    
    return {
      solveCount: eventSolves.length,
      average: Math.round(average),
      bestSingle,
    };
  },
});

// Helper functions
function getStartOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function generateDailyPlans(
  skillLevel: string,
  goalType: string,
  dailyMinutes: number,
  practiceSchedule: string[] | undefined,
  weekStart: number
) {
  const plans = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Default to all days if no schedule provided
  const activeDays = practiceSchedule || daysOfWeek;
  
  for (let i = 0; i < 7; i++) {
    const dayDate = weekStart + i * 24 * 60 * 60 * 1000;
    const dayName = daysOfWeek[i];
    const isRestDay = !activeDays.includes(dayName);
    
    if (isRestDay) {
      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: "Rest Day",
        activities: [{
          type: "rest" as const,
          title: "Rest & Recovery",
          description: "Take a break from cubing. Let your muscles and mind recover.",
          durationMinutes: 0,
          completed: false,
        }],
        isCompleted: false,
        isRestDay: true,
      });
    } else {
      const activities = generateActivitiesForDay(skillLevel, goalType, dailyMinutes, i);
      plans.push({
        dayOfWeek: i,
        date: dayDate,
        focus: getDayFocus(skillLevel, goalType, i),
        activities,
        isCompleted: false,
        isRestDay: false,
      });
    }
  }
  
  return plans;
}

function getDayFocus(skillLevel: string, goalType: string, dayIndex: number): string {
  const beginnerFocuses = [
    "Cross Practice",
    "F2L Basics",
    "Last Layer Algorithms",
    "Cross Practice",
    "Full Solve Practice",
    "F2L Efficiency",
    "Timed Averages",
  ];
  
  const intermediateFocuses = [
    "Cross + F2L Flow",
    "Lookahead Training",
    "Algorithm Speed",
    "Slow Solves Analysis",
    "Full Speed Practice",
    "Efficiency Focus",
    "Competition Simulation",
  ];
  
  const advancedFocuses = [
    "Advanced F2L",
    "Lookahead Mastery",
    "Algorithm Recognition",
    "Reconstructions",
    "Speed Sessions",
    "Weakness Training",
    "Competition Prep",
  ];
  
  if (skillLevel === "beginner") return beginnerFocuses[dayIndex];
  if (skillLevel === "intermediate") return intermediateFocuses[dayIndex];
  return advancedFocuses[dayIndex];
}

function generateActivitiesForDay(
  skillLevel: string,
  goalType: string,
  dailyMinutes: number,
  dayIndex: number
) {
  const activities: Array<{
    type: "timed-solves" | "untimed-practice" | "algorithm-drill" | "slow-solves" | "reconstruction" | "cross-practice" | "f2l-practice" | "lookahead-training" | "competition-sim" | "rest";
    title: string;
    description: string;
    durationMinutes: number;
    targetSolves?: number;
    completed: boolean;
  }> = [];
  
  // Allocate time based on skill level and day
  const timePerActivity = Math.floor(dailyMinutes / 3);
  
  if (skillLevel === "beginner") {
    switch (dayIndex % 7) {
      case 0: // Cross Practice
        activities.push({
          type: "cross-practice",
          title: "Cross Practice",
          description: "Practice solving the cross efficiently. Focus on planning the cross during inspection.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Slow Solves",
          description: "Do slow, deliberate solves focusing on each step without rushing.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 4),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Timed Practice",
          description: "Regular timed solves to build speed and consistency.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 1: // F2L Basics
        activities.push({
          type: "f2l-practice",
          title: "F2L Training",
          description: "Practice first two layers. Focus on intuitive pair insertion.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 3),
          completed: false,
        });
        activities.push({
          type: "algorithm-drill",
          title: "F2L Cases Review",
          description: "Review and practice common F2L cases.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Full Solves",
          description: "Apply what you learned in timed solves.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 2: // Last Layer
        activities.push({
          type: "algorithm-drill",
          title: "OLL Practice",
          description: "Practice OLL algorithms. Focus on recognition and execution.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "algorithm-drill",
          title: "PLL Practice",
          description: "Practice PLL algorithms. Work on muscle memory.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Full Solves",
          description: "Practice full solves focusing on last layer efficiency.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "timed-solves",
          title: "Warm-up Solves",
          description: "Start with some warm-up solves to get your hands moving.",
          durationMinutes: Math.floor(timePerActivity / 2),
          targetSolves: 5,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Analysis Solves",
          description: "Do slow solves while analyzing each move.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 4),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Speed Practice",
          description: "Fast-paced timed solves. Push your limits!",
          durationMinutes: timePerActivity + Math.floor(timePerActivity / 2),
          targetSolves: Math.floor(dailyMinutes / 2),
          completed: false,
        });
    }
  } else if (skillLevel === "intermediate") {
    switch (dayIndex % 7) {
      case 0: // Cross + F2L Flow
        activities.push({
          type: "cross-practice",
          title: "Cross Efficiency",
          description: "Practice 8-move or less crosses. Plan during inspection.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 1.5),
          completed: false,
        });
        activities.push({
          type: "f2l-practice",
          title: "Cross to F2L Transition",
          description: "Focus on smooth transition from cross to first F2L pair.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Timed Averages",
          description: "Do timed ao5 and ao12 focusing on consistency.",
          durationMinutes: timePerActivity,
          targetSolves: 12,
          completed: false,
        });
        break;
      case 1: // Lookahead
        activities.push({
          type: "lookahead-training",
          title: "Lookahead Drills",
          description: "Practice tracking the next pair while solving the current one.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Slow Turning Practice",
          description: "Turn slowly but never stop. Focus on continuous lookahead.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 5),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Apply Lookahead",
          description: "Timed solves applying lookahead techniques.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 6: // Competition Sim
        activities.push({
          type: "competition-sim",
          title: "Competition Simulation",
          description: "Simulate competition conditions. Do an official ao5.",
          durationMinutes: dailyMinutes,
          targetSolves: 5,
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "algorithm-drill",
          title: "Algorithm Speed",
          description: "Drill your algorithms for faster execution.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "untimed-practice",
          title: "Efficiency Practice",
          description: "Work on reducing move count in your solves.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Speed Session",
          description: "Push for PBs in your timed session.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 2),
          completed: false,
        });
    }
  } else {
    // Advanced/Expert
    switch (dayIndex % 7) {
      case 0: // Advanced F2L
        activities.push({
          type: "f2l-practice",
          title: "Advanced F2L Cases",
          description: "Practice difficult F2L cases and alternate solutions.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "reconstruction",
          title: "Solve Reconstruction",
          description: "Reconstruct your solves and find improvements.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Sprint Session",
          description: "High-intensity speed solves.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 1.5),
          completed: false,
        });
        break;
      case 3: // Reconstructions
        activities.push({
          type: "reconstruction",
          title: "Video Analysis",
          description: "Record and analyze your solves for improvements.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "slow-solves",
          title: "Perfect Execution",
          description: "Focus on perfect fingertricks and rotations.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 5),
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "Apply Improvements",
          description: "Practice with improvements from analysis.",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(timePerActivity / 2),
          completed: false,
        });
        break;
      case 6: // Competition Prep
        activities.push({
          type: "competition-sim",
          title: "Full Competition Simulation",
          description: "Simulate full competition round with pressure.",
          durationMinutes: dailyMinutes,
          targetSolves: 5,
          completed: false,
        });
        break;
      default:
        activities.push({
          type: "algorithm-drill",
          title: "Algorithm Recognition",
          description: "Fast recognition drills for LL algorithms.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "lookahead-training",
          title: "Advanced Lookahead",
          description: "Work on full F2L lookahead.",
          durationMinutes: timePerActivity,
          completed: false,
        });
        activities.push({
          type: "timed-solves",
          title: "PB Hunting",
          description: "Go for personal bests!",
          durationMinutes: timePerActivity,
          targetSolves: Math.floor(dailyMinutes / 1.5),
          completed: false,
        });
    }
  }
  
  return activities;
}
