"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  MessageSquare,
  Database,
  Zap,
  Target,
  BookOpen,
  Trophy,
  Clock,
  Brain,
  Sparkles,
  BarChart3,
  Users,
  Lightbulb,
  Repeat,
  Eye,
} from "lucide-react";

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
  onFocusInput?: () => void;
}

export default function WelcomeScreen({
  onSendMessage,
  onFocusInput,
}: WelcomeScreenProps) {
  const allSuggestions = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Analyze my solves",
      description: "Get insights from your CubeDev solve times",
      message: "Analyze my solve times and give me insights on how to improve",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Learn F2L algorithms",
      description: "Master First Two Layers techniques",
      message: "Teach me the best F2L algorithms for beginners",
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "WCA world records",
      description: "Query current world records",
      message: "What are the current world records for 3x3?",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Training plan",
      description: "Get personalized improvement advice",
      message: "Give me a training plan to improve my F2L times",
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "PLL recognition",
      description: "Improve last layer recognition",
      message: "Help me improve my PLL recognition speed",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "OLL algorithms",
      description: "Learn Orientation of Last Layer",
      message: "Show me the most efficient OLL algorithms",
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: "Competition tips",
      description: "Prepare for your first competition",
      message: "What should I know before my first speedcubing competition?",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Cross optimization",
      description: "Speed up your cross solving",
      message: "How can I solve the cross faster and more efficiently?",
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Lookahead techniques",
      description: "Reduce pause times between moves",
      message: "Teach me lookahead techniques to improve my solve flow",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "CFOP method",
      description: "Master the most popular method",
      message:
        "Explain the CFOP method and how to transition from beginner's method",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Compare solve times",
      description: "See how you stack up globally",
      message: "How do my times compare to other cubers at my level?",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Famous cubers",
      description: "Learn about top speedcubers",
      message: "Tell me about the fastest speedcubers in the world",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Breaking bad habits",
      description: "Identify and fix common mistakes",
      message: "What are common bad habits in speedcubing and how to fix them?",
    },
    {
      icon: <Repeat className="w-5 h-5" />,
      title: "Finger tricks",
      description: "Learn efficient finger movements",
      message: "Show me important finger tricks for faster solving",
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: "Color neutrality",
      description: "Solve from any cross color",
      message: "Should I learn color neutrality and how do I start?",
    },
  ];

  // Randomly select 4 suggestions to display
  const suggestions = useMemo(() => {
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 min-h-[calc(100vh-300px)]">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Welcome Header */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] font-statement flex items-center justify-center gap-3">
            Hey! I'm Cubie
            <span className="inline-block animate-wave origin-[70%_70%]">
              👋
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-inter max-w-2xl mx-auto">
            Your speedcubing assistant. Ask me anything about cubing, training,
            competitions, or get personalized advice!
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                onSendMessage(suggestion.message);
                onFocusInput?.();
              }}
              className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] rounded-xl text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  {suggestion.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 font-button">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-inter">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}