"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Mail,
  Calendar,
  User,
  ExternalLink,
  Reply,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={toggleOpen}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
        >
          {isOpen ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {isOpen && children}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case "new":
        return "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20";
      case "read":
        return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20";
      case "replied":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
      case "resolved":
        return "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20";
      default:
        return "bg-[var(--surface-elevated)] text-[var(--text-muted)]";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-3 h-3" />;
      case "read":
        return <Eye className="w-3 h-3" />;
      case "replied":
        return <Reply className="w-3 h-3" />;
      case "resolved":
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}
    >
      {getIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Contact Message Item
function ContactItem({
  message,
  isExpanded,
  onToggle,
  onStatusChange,
}: {
  message: any;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: "new" | "read" | "replied" | "resolved") => void;
}) {
  const [adminNotes, setAdminNotes] = useState(message.adminNotes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const updateStatus = useMutation(api.contactMessages.updateMessageStatus);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(ts);
  };

  const handleSaveNotes = async () => {
    await updateStatus({
      messageId: message._id,
      status: message.status,
      adminNotes,
    });
    setIsEditingNotes(false);
  };

  return (
    <div
      className={`timer-card !p-0 overflow-hidden transition-colors ${
        message.status === "new" ? "!border-[var(--info)]" : ""
      }`}
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={message.status} />
            <span className="text-xs text-[var(--text-muted)] font-inter">
              {getTimeAgo(message.createdAt)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-statement truncate">
            {message.subject}
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            From: {message.name} &lt;{message.email}&gt;
          </p>
        </div>
        <div className="flex items-center gap-2 pl-4">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] space-y-4">
          {/* Sender Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                <User className="w-3 h-3" />
                <span className="text-xs font-inter">Name</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
                {message.name}
              </p>
            </div>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                <Mail className="w-3 h-3" />
                <span className="text-xs font-inter">Email</span>
              </div>
              <a
                href={`mailto:${message.email}`}
                className="text-sm font-medium text-[var(--primary)] hover:underline font-inter truncate block"
              >
                {message.email}
              </a>
            </div>
            {message.wcaId && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="text-xs font-inter">WCA ID</span>
                </div>
                <a
                  href={`https://www.worldcubeassociation.org/persons/${message.wcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--primary)] hover:underline font-inter"
                >
                  {message.wcaId}
                </a>
              </div>
            )}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1">
                <Calendar className="w-3 h-3" />
                <span className="text-xs font-inter">Submitted</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] font-inter">
                {formatDate(message.createdAt)}
              </p>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-secondary)] font-inter mb-2">
              Message
            </h4>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4">
              <p className="text-sm text-[var(--text-primary)] font-inter whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] font-inter">
                Admin Notes
              </h4>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-[var(--primary)] hover:underline font-inter"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] font-inter focus:outline-none focus:border-[var(--primary)] resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setAdminNotes(message.adminNotes || "");
                      setIsEditingNotes(false);
                    }}
                    className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] font-inter transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4 min-h-[60px]">
                <p className="text-sm text-[var(--text-primary)] font-inter whitespace-pre-wrap">
                  {message.adminNotes || (
                    <span className="text-[var(--text-muted)] italic">
                      No notes added
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--text-muted)] font-inter">
              Update status:
            </span>
            <button
              onClick={() => onStatusChange("read")}
              disabled={message.status === "read"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-inter transition-colors ${
                message.status === "read"
                  ? "bg-[var(--warning)]/20 text-[var(--warning)] cursor-not-allowed"
                  : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--warning)]/10 hover:text-[var(--warning)]"
              }`}
            >
              <Eye className="w-3 h-3" />
              Read
            </button>
            <button
              onClick={() => onStatusChange("replied")}
              disabled={message.status === "replied"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-inter transition-colors ${
                message.status === "replied"
                  ? "bg-[var(--success)]/20 text-[var(--success)] cursor-not-allowed"
                  : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--success)]/10 hover:text-[var(--success)]"
              }`}
            >
              <Reply className="w-3 h-3" />
              Replied
            </button>
            <button
              onClick={() => onStatusChange("resolved")}
              disabled={message.status === "resolved"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-inter transition-colors ${
                message.status === "resolved"
                  ? "bg-[var(--text-muted)]/20 text-[var(--text-muted)] cursor-not-allowed"
                  : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-muted)]"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContact() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const messages = useQuery(api.contactMessages.getContactMessages, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const updateStatus = useMutation(api.contactMessages.updateMessageStatus);

  const handleStatusChange = async (
    messageId: Id<"contactMessages">,
    status: "new" | "read" | "replied" | "resolved",
  ) => {
    await updateStatus({ messageId, status });
  };

  const statusCounts = messages
    ? {
        all: messages.length,
        new: messages.filter((m) => m.status === "new").length,
        read: messages.filter((m) => m.status === "read").length,
        replied: messages.filter((m) => m.status === "replied").length,
        resolved: messages.filter((m) => m.status === "resolved").length,
      }
    : null;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
          Contact Messages
        </h1>
        <p className="mt-1 text-[var(--text-muted)] font-inter">
          Manage contact form submissions
        </p>
      </div>

      {/* Stats Card */}
      <CollapsibleCard
        title="Message Overview"
        storageKey="admin-contact-stats-open"
        defaultOpen={true}
      >
        {statusCounts && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setStatusFilter("all")}
              className={`p-4 rounded-xl border transition-colors ${
                statusFilter === "all"
                  ? "bg-[var(--primary)]/10 border-[var(--primary)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                {statusCounts.all}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter">All</p>
            </button>
            <button
              onClick={() => setStatusFilter("new")}
              className={`p-4 rounded-xl border transition-colors ${
                statusFilter === "new"
                  ? "bg-[var(--info)]/10 border-[var(--info)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--info)] font-statement">
                {statusCounts.new}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter">New</p>
            </button>
            <button
              onClick={() => setStatusFilter("read")}
              className={`p-4 rounded-xl border transition-colors ${
                statusFilter === "read"
                  ? "bg-[var(--warning)]/10 border-[var(--warning)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--warning)] font-statement">
                {statusCounts.read}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter">
                Read
              </p>
            </button>
            <button
              onClick={() => setStatusFilter("replied")}
              className={`p-4 rounded-xl border transition-colors ${
                statusFilter === "replied"
                  ? "bg-[var(--success)]/10 border-[var(--success)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--success)] font-statement">
                {statusCounts.replied}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter">
                Replied
              </p>
            </button>
            <button
              onClick={() => setStatusFilter("resolved")}
              className={`p-4 rounded-xl border transition-colors ${
                statusFilter === "resolved"
                  ? "bg-[var(--text-muted)]/10 border-[var(--text-muted)]"
                  : "bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="text-2xl font-bold text-[var(--text-muted)] font-statement">
                {statusCounts.resolved}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter">
                Resolved
              </p>
            </button>
          </div>
        )}
      </CollapsibleCard>

      {/* Messages List Card */}
      <div className="mt-6">
        <CollapsibleCard
          title="Messages"
          storageKey="admin-contact-messages-open"
          defaultOpen={true}
        >
          <div className="space-y-3">
            {messages === undefined ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="timer-card animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                      <div className="h-4 w-20 bg-[var(--surface-elevated)] rounded" />
                    </div>
                    <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded mb-1" />
                    <div className="h-3 w-32 bg-[var(--surface-elevated)] rounded" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="timer-card text-center py-8">
                <Mail className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)] font-inter">
                  {statusFilter === "all"
                    ? "No contact messages yet"
                    : `No ${statusFilter} messages`}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ContactItem
                  key={message._id}
                  message={message}
                  isExpanded={expandedId === message._id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === message._id ? null : message._id,
                    )
                  }
                  onStatusChange={(status) =>
                    handleStatusChange(message._id, status)
                  }
                />
              ))
            )}
          </div>
        </CollapsibleCard>
      </div>
    </div>
  );
}
