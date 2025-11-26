"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  MessageSquarePlus,
  Menu,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useCubieAuth } from "./useCubieAuth";
import ChatMessage from "./ChatMessage";
import ChatHeader from "./ChatHeader";
import SessionManagementModal from "./SessionManagementModal";
import WelcomeScreen from "./WelcomeScreen";
import { useRouter } from "next/navigation";
import {
  CubieWelcomeSkeleton,
  CubieMessagesSkeleton,
} from "@/components/SkeletonLoaders";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    tools_used?: Array<{
      tool_type: string;
      query: string;
      execution_time_ms?: number;
    }>;
    sources?: Array<{
      type: string;
      title: string;
      url?: string;
    }>;
    total_processing_time_ms?: number;
  };
  feedback?: {
    feedback_type: "like" | "dislike";
    comment?: string;
    created_at: string;
  };
  created_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface ChatInterfaceProps {
  initialSessionId?: string;
}

export default function ChatInterface({
  initialSessionId,
}: ChatInterfaceProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getAuthToken, isAuthenticated } = useCubieAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadedSessionRef = useRef<string | null>(null);
  const isLoadingSessionRef = useRef(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_CUBIE_BACKEND_URL;

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessions = async () => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/chat/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setSessionsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadSessionHistory = useCallback(
    async (sessionId: string, forceReload: boolean = false) => {
      // Prevent multiple simultaneous loads of the same session
      if (isLoadingSessionRef.current && !forceReload) {
        console.log("Already loading a session, skipping...");
        return;
      }

      // Skip if this session is already loaded and we're not forcing reload
      if (loadedSessionRef.current === sessionId && !forceReload) {
        console.log("Session already loaded, skipping...");
        return;
      }

      const token = await getAuthToken();
      if (!token) return;

      isLoadingSessionRef.current = true;
      setIsLoadingSession(true);
      setError(null);

      try {
        const response = await fetch(
          `${BACKEND_URL}/chat/session/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Update state in the correct order
          setCurrentSession(data.session);
          setMessages(data.messages || []);
          loadedSessionRef.current = sessionId;

          // Dispatch event for dynamic title update
          window.dispatchEvent(
            new CustomEvent("cubie-session-loaded", {
              detail: {
                sessionId: data.session.session_id,
                title: data.session.title,
              },
            })
          );

          // Navigate to session URL only if we're not already there
          const currentPath = window.location.pathname;
          const targetPath = `/cube-lab/cubie/${sessionId}`;
          if (currentPath !== targetPath) {
            router.push(targetPath);
          }
        } else {
          throw new Error("Failed to load session history");
        }
      } catch (error) {
        console.error("Error loading session:", error);
        setError("Failed to load conversation history");
        setMessages([]);
        loadedSessionRef.current = null;
      } finally {
        setIsLoadingSession(false);
        isLoadingSessionRef.current = false;
      }
    },
    [BACKEND_URL, getAuthToken, router]
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user sessions on mount (only once)
  useEffect(() => {
    if (user && !sessionsLoaded) {
      loadSessions();
    }
  }, [user, sessionsLoaded]);

  // Load initial session if provided via URL
  useEffect(() => {
    if (initialSessionId && user && sessionsLoaded) {
      // Only load if it's a different session than what we already have loaded
      if (loadedSessionRef.current !== initialSessionId) {
        console.log(`Loading session: ${initialSessionId}`);
        loadSessionHistory(initialSessionId, false);
      }
    } else if (!initialSessionId && loadedSessionRef.current) {
      // Clear when navigating to base cubie page
      console.log("Clearing session state");
      loadedSessionRef.current = null;
      setMessages([]);
      setCurrentSession(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId, user, sessionsLoaded]);

  const createNewSession = async (initialMessage?: string) => {
    const token = await getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/chat/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: initialMessage
            ? initialMessage.slice(0, 50) +
              (initialMessage.length > 50 ? "..." : "")
            : "New Conversation",
          initial_message: initialMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Create a full session object
        const newSession = {
          session_id: data.session_id,
          user_id: data.user_id,
          title: data.title,
          created_at: data.created_at,
          updated_at: data.updated_at,
          message_count: 0,
        };

        // Update state immediately for smooth transition
        setCurrentSession(newSession);
        setMessages([]);
        loadedSessionRef.current = data.session_id;

        // Add to sessions list without full reload
        setSessions((prev) => [newSession, ...prev]);

        // Navigate to the new session URL
        router.push(`/cube-lab/cubie/${data.session_id}`);

        return data.session_id;
      } else {
        const errorData = await response.json();
        console.error("Failed to create session:", errorData);
        console.error("Status:", response.status, response.statusText);
        setError(
          `Failed to create session: ${errorData.detail || "Unknown error"}`
        );
        return null;
      }
    } catch (error) {
      console.error("Error creating session:", error);
      setError(
        `Error creating session: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return null;
    }
  };

  const handleNewChat = async () => {
    // Clear state immediately for smooth UX
    setCurrentSession(null);
    setMessages([]);
    setError(null);
    setInputValue("");
    loadedSessionRef.current = null;

    // Navigate to the base cubie page
    router.push("/cube-lab/cubie");
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const token = await getAuthToken();
    if (!token) {
      setError("Authentication required. Please sign in.");
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    setIsLoading(true);
    setAgentStatus("Processing your query...");

    // Don't create empty streaming message initially - let streaming handle it
    const streamingMessageId = `streaming-${Date.now()}`;

    try {
      // Create session if needed
      let sessionId = currentSession?.session_id;
      if (!sessionId) {
        sessionId = await createNewSession(userMessage);
        if (!sessionId) {
          throw new Error("Failed to create session");
        }
      }

      // Send message to backend
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          use_rag: true,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = "Failed to get response";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Handle streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let partialResponse = "";
        let messageCreated = false;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  // Handle status updates
                  if (data.type === "status") {
                    setAgentStatus(data.message || "Processing...");
                  } else if (data.type === "content") {
                    partialResponse = data.partial;
                    setAgentStatus(""); // Clear status when content starts

                    // Create message on first content chunk
                    if (!messageCreated) {
                      const streamingMessage: Message = {
                        id: streamingMessageId,
                        role: "assistant",
                        content: partialResponse,
                        created_at: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, streamingMessage]);
                      messageCreated = true;
                    } else {
                      // Update existing message
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === streamingMessageId
                            ? { ...msg, content: partialResponse }
                            : msg
                        )
                      );
                    }
                  } else if (data.type === "complete") {
                    setAgentStatus("");
                    if (messageCreated) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === streamingMessageId
                            ? {
                                ...msg,
                                id: data.message_id || streamingMessageId,
                                content: data.response,
                                metadata: data.metadata,
                              }
                            : msg
                        )
                      );
                    } else {
                      // Fallback: create message if no content chunks received
                      const completeMessage: Message = {
                        id: data.message_id || streamingMessageId,
                        role: "assistant",
                        content: data.response,
                        metadata: data.metadata,
                        created_at: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, completeMessage]);
                    }
                  } else if (data.type === "error") {
                    throw new Error(data.error);
                  } else if (data.status === "done") {
                    // Stream complete
                    setAgentStatus("");
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete JSON
                  console.debug("Parse error (likely incomplete chunk):", e);
                }
              }
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json();

        // Check if the response indicates an error
        if (data.status === "error") {
          throw new Error(
            data.error || "An error occurred while processing your request"
          );
        }

        // Create and add the assistant message for non-streaming
        const assistantMessage: Message = {
          id: data.message_id || streamingMessageId,
          role: "assistant",
          content: data.response,
          metadata: data.metadata,
          created_at: data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Update current session info without reloading all sessions
      if (sessionId) {
        try {
          const sessionResponse = await fetch(
            `${BACKEND_URL}/chat/session/${sessionId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setCurrentSession(sessionData.session);

            // Update the session in the sessions list without full reload
            setSessions((prev) =>
              prev.map((s) =>
                s.session_id === sessionId
                  ? { ...s, ...sessionData.session }
                  : s
              )
            );
          }
        } catch (err) {
          console.error("Failed to reload session:", err);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Extract error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.";

      setError(errorMessage);
      setAgentStatus(""); // Clear status on error

      // Add an error message from the assistant
      const errorAssistantMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I apologize, but I encountered an error: ${errorMessage}`,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
      setAgentStatus(""); // Ensure status is cleared
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      // Limit to max 3 rows (approximately 120px)
      const maxHeight = 120;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      // Show scrollbar only when content exceeds max height
      textareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [inputValue]);

  const handleDeleteSession = async (sessionId: string) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update sessions list
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));

        // If deleting current session, navigate to home
        if (currentSession?.session_id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
          router.push("/cube-lab/cubie");
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      setError("Failed to delete session");
    }
  };

  const handleUpdateSession = async (sessionId: string, title: string) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/chat/session/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update sessions list
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === sessionId
              ? { ...s, title: data.title, updated_at: data.updated_at }
              : s
          )
        );

        // Update current session if it's the one being edited
        if (currentSession?.session_id === sessionId) {
          setCurrentSession((prev) =>
            prev
              ? { ...prev, title: data.title, updated_at: data.updated_at }
              : null
          );

          // Dispatch event for dynamic title update
          window.dispatchEvent(
            new CustomEvent("cubie-session-loaded", {
              detail: {
                sessionId: sessionId,
                title: data.title,
              },
            })
          );
        }
      } else {
        throw new Error("Failed to update session");
      }
    } catch (error) {
      console.error("Error updating session:", error);
      setError("Failed to update session title");
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleFeedbackSubmit = async (
    messageId: string,
    feedbackType: "like" | "dislike",
    comment: string
  ) => {
    const token = await getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/chat/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: feedbackType,
          comment: comment || undefined,
        }),
      });

      if (response.ok) {
        // Update the message in the state with feedback
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  feedback: {
                    feedback_type: feedbackType,
                    comment: comment || undefined,
                    created_at: new Date().toISOString(),
                  },
                }
              : msg
          )
        );
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback");
      throw error;
    }
  };

  // Listen for mobile session modal trigger event
  useEffect(() => {
    const handleOpenModal = () => {
      setIsSessionModalOpen(true);
    };

    window.addEventListener("cubie-open-session-modal" as any, handleOpenModal);

    return () => {
      window.removeEventListener(
        "cubie-open-session-modal" as any,
        handleOpenModal
      );
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Chat Header - Hidden on mobile */}
      <div className="hidden md:block">
        <ChatHeader
          currentSession={currentSession}
          onOpenSessionModal={() => setIsSessionModalOpen(true)}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      {/* Session Management Modal */}
      <SessionManagementModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={loadSessionHistory}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onUpdateSession={handleUpdateSession}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingSession ? (
          <CubieMessagesSkeleton />
        ) : messages.length === 0 ? (
          currentSession ? (
            // Session is loaded but has no messages - this shouldn't normally happen
            <WelcomeScreen onSendMessage={setInputValue} />
          ) : (
            // No session selected, show welcome screen
            <WelcomeScreen onSendMessage={setInputValue} />
          )
        ) : (
          <div className="max-w-4xl mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onFeedbackSubmit={handleFeedbackSubmit}
              />
            ))}
            {isLoading && agentStatus && (
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent)] animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="px-3 md:px-4 py-2 md:py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <p className="font-inter text-sm md:text-base text-[var(--text-secondary)]">
                      {agentStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-3 md:mx-4 lg:mx-6 mb-3 md:mb-4 px-3 md:px-4 py-2 md:py-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg flex items-center gap-2 text-[var(--error)]">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="font-inter text-xs md:text-sm">{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 md:px-4 lg:px-6 py-3 md:py-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Cubie anything about cubing..."
              rows={1}
              className="w-full pl-4 pr-14 md:pr-16 py-3 md:py-3.5 bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--primary)] focus:outline-none rounded-2xl resize-none text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-inter transition-all duration-200 ease-in-out scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--border-hover)]"
              disabled={isLoading}
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 md:w-9 md:h-9 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 ease-in-out flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center font-inter">
            Cubie can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
