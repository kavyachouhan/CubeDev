"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function AccountDeletionSection() {
  const { user, signOut } = useUser();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteAccount = useMutation(api.users.deleteUserAccount);

  const handleDeleteAccount = async () => {
    if (!user?.convexId || deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);

    try {
      // Delete the user account from the database
      await deleteAccount({ userId: user.convexId as any });

      // Notify user of successful deletion
      alert(
        "Your account has been successfully deleted. You will be redirected to the homepage."
      );

      // Perform cleanup and logout
      await performCleanupAndLogout();
    } catch (error) {
      console.error("Failed to delete account:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to delete account. Please try again.";

      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error occurred. Please check your connection and try again.";
        } else if (
          error.message.includes("unauthorized") ||
          error.message.includes("forbidden")
        ) {
          errorMessage =
            "Session expired. Please log in again and try deleting your account.";
        } else {
          errorMessage = `Failed to delete account: ${error.message}`;
        }
      }

      alert(errorMessage + " If the issue persists, please contact support.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConfirmation("");
    }
  };

  const performCleanupAndLogout = async () => {
    try {
      // Log out the user
      signOut();

      // Clear user session using UserProvider's signOut
      sessionStorage.clear();

      // Clear any cached queries or local storage that might contain user data
      if (typeof window !== "undefined") {
        // Clear any other app-specific storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith("cubedev_") || key.startsWith("convex_"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      // Redirect to homepage after cleanup
      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
      // Even if cleanup fails, ensure the user is redirected
      router.push("/");
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="timer-card border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
              Delete Account
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Permanently remove your CubeDev account and all associated data
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                What happens when you delete your account:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• All your timer data and solve history will be removed</li>
                <li>• Your challenge room participation will be anonymized</li>
                <li>• Your profile will be hidden from public view</li>
                <li>• You will be logged out immediately</li>
                <li>• Your WCA profile remains unaffected</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm md:text-base w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4" />
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-lg shadow-xl max-w-md w-full border border-[var(--border)]">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  Confirm Account Deletion
                </h3>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmation("");
                  }}
                  className="p-1 hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-[var(--text-secondary)] mb-4 text-sm md:text-base">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from CubeDev.
                </p>

                <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Type <span className="font-bold text-red-500">DELETE</span> to
                  confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface-elevated)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmation("");
                  }}
                  className="flex-1 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-md text-[var(--text-primary)] font-medium transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}