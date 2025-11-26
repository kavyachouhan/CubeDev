"use client";

import { useState } from "react";
import {
  User,
  Bot,
  Database,
  Search,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Image from "next/image";
import { Message } from "./ChatInterface";
import { useUser } from "@/components/UserProvider";
import { formatToLocalTime } from "@/lib/date-utils";
import FeedbackModal from "./FeedbackModal";

interface ChatMessageProps {
  message: Message;
  onFeedbackSubmit?: (
    messageId: string,
    feedbackType: "like" | "dislike",
    comment: string
  ) => Promise<void>;
}

export default function ChatMessage({
  message,
  onFeedbackSubmit,
}: ChatMessageProps) {
  const { user } = useUser();
  const isUser = message.role === "user";
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<
    "like" | "dislike" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);

  // Check if message has a valid MongoDB ObjectId (24 hex characters)
  const hasValidMessageId =
    message.id &&
    message.id.length === 24 &&
    /^[a-f0-9]{24}$/i.test(message.id);

  // Format UTC time to user's local timezone
  const formattedTime = formatToLocalTime(message.created_at);

  const handleFeedbackClick = (type: "like" | "dislike") => {
    setSelectedFeedbackType(type);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (comment: string) => {
    if (!selectedFeedbackType || !onFeedbackSubmit) return;

    setIsSubmitting(true);
    try {
      await onFeedbackSubmit(message.id, selectedFeedbackType, comment);
      setIsFeedbackModalOpen(false);
      setSelectedFeedbackType(null);

      // Show badge and fade it after 3 seconds
      setShowFeedbackBadge(true);
      setTimeout(() => {
        setShowFeedbackBadge(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setIsFeedbackModalOpen(false);
      setSelectedFeedbackType(null);
    }
  };

  return (
    <div className={`flex gap-2 md:gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
            : "bg-[var(--accent)]/10 border border-[var(--accent)]/20"
        }`}
      >
        {isUser ? (
          user?.avatar ? (
            <Image
              src={user.avatar.url || user.avatar}
              alt={`${user.name}'s avatar`}
              width={40}
              height={40}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 md:w-5 md:h-5 text-[var(--primary)]" />
          )
        ) : (
          <Bot className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent)]" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 max-w-3xl min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}
      >
        {/* Message Bubble */}
        <div
          className={`px-3 md:px-4 py-2 md:py-3 rounded-xl ${
            isUser
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
          }`}
        >
          <p className="font-inter text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Metadata */}
        <div className="mt-1.5 md:mt-2 flex items-center gap-2 md:gap-3 text-xs text-[var(--text-muted)] flex-wrap">
          <span className="flex items-center gap-1 font-inter">
            {formattedTime}
          </span>

          {/* Show tools used for assistant messages */}
          {!isUser &&
            message.metadata?.tools_used &&
            message.metadata.tools_used.length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                {message.metadata.tools_used.map((tool, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md font-inter text-xs"
                  >
                    {tool.tool_type === "knowledge_base" ? (
                      <Database className="w-3 h-3" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    <span className="sm:inline">{tool.tool_type}</span>
                  </span>
                ))}
              </div>
            )}

          {/* Feedback Buttons - Only for bot messages without existing feedback and with valid message ID */}
          {!isUser && !message.feedback && hasValidMessageId && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedbackClick("like")}
                className="p-1 hover:bg-[var(--success)]/10 border border-transparent hover:border-[var(--success)]/20 rounded transition-colors"
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--success)]" />
              </button>
              <button
                onClick={() => handleFeedbackClick("dislike")}
                className="p-1 hover:bg-[var(--error)]/10 border border-transparent hover:border-[var(--error)]/20 rounded transition-colors"
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--error)]" />
              </button>
            </div>
          )}

          {/* Feedback Badge - Shows after submission and fades */}
          {!isUser && showFeedbackBadge && message.feedback && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-opacity duration-500 ${
                message.feedback.feedback_type === "like"
                  ? "bg-[var(--success)]/10 border border-[var(--success)]/20"
                  : "bg-[var(--error)]/10 border border-[var(--error)]/20"
              } ${showFeedbackBadge ? "opacity-100" : "opacity-0"}`}
            >
              {message.feedback.feedback_type === "like" ? (
                <>
                  <ThumbsUp className="w-3 h-3 text-[var(--success)]" />
                  <span className="text-xs text-[var(--success)] font-inter font-medium">
                    Helpful
                  </span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-3 h-3 text-[var(--error)]" />
                  <span className="text-xs text-[var(--error)] font-inter font-medium">
                    Not helpful
                  </span>
                </>
              )}
            </div>
          )}

          {/* Processing time */}
          {!isUser && message.metadata?.total_processing_time_ms && (
            <span className="font-inter sm:inline">
              {(message.metadata.total_processing_time_ms / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        
        

        {/* Sources */}
        {!isUser &&
          message.metadata?.sources &&
          message.metadata.sources.length > 0 && (
            <div className="mt-2 md:mt-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--text-muted)] font-inter">
                Sources:
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {message.metadata.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url || "#"}
                    target={source.url ? "_blank" : undefined}
                    rel={source.url ? "noopener noreferrer" : undefined}
                    className={`text-xs px-2 md:px-3 py-1 md:py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors font-inter ${
                      source.url ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

        {/* Feedback Modal */}
        {selectedFeedbackType && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={handleModalClose}
            feedbackType={selectedFeedbackType}
            onSubmit={handleFeedbackSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
