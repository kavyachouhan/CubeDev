"use client";

import { Trash2 } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";

export default function AccountDeletionSection() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const deleteAccount = useMutation(api.users.deleteUserAccount);

  const performCleanupAndLogout = async () => {
    try {
      signOut();
      sessionStorage.clear();

      if (typeof window !== "undefined") {
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

      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
      router.push("/");
    }
  };

  const accountDelete = useConfirmDelete(async () => {
    if (!user?.convexId) return;

    try {
      await deleteAccount({ userId: user.convexId as any });
    } catch (error) {
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

      throw new Error(
        `${errorMessage} If the issue persists, please contact support.`,
      );
    }

    await performCleanupAndLogout();
  });

  if (!user) return null;

  return (
    <>
      <div className="timer-card">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
              Delete Account
            </h3>
            <p className="text-sm text-(--text-muted)">
              Permanently remove your CubeDev account and all associated data
            </p>
          </div>
        </div>

        <div className="bg-(--error)/10 border border-(--error)/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div>
              <h4 className="font-semibold text-(--error) mb-2">
                What happens when you delete your account:
              </h4>
              <ul className="text-sm text-(--error)/80 space-y-1">
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
          onClick={() => accountDelete.request()}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-(--error) hover:opacity-90 text-white rounded-lg font-medium transition-all text-sm md:text-base w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4" />
          Delete My Account
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={accountDelete.isOpen}
        onClose={accountDelete.cancel}
        onConfirm={accountDelete.confirm}
        isDeleting={accountDelete.isDeleting}
        title="Delete Account?"
        description="This will permanently delete your CubeDev account and remove all associated data."
        requireTypedConfirmation="DELETE"
        warning="All timer data, solve history, and profile information will be permanently deleted. Your WCA profile remains unaffected."
        confirmLabel="Delete Account"
      />
    </>
  );
}