"use client";

import { Trash2 } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

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
      <Card variant="static" className="border-(--error)/40!">
        <CardHeader
          title="Delete Account"
          description="Permanently remove your CubeDev account and all associated data"
        />

        <Alert tone="error" title="What happens when you delete your account" className="mb-5">
          <ul className="list-disc pl-4 space-y-0.5">
            <li>All your timer data and solve history will be removed</li>
            <li>Your challenge room participation will be anonymized</li>
            <li>Your profile will be hidden from public view</li>
            <li>You will be logged out immediately</li>
            <li>Your WCA profile remains unaffected</li>
          </ul>
        </Alert>

        <Button
          variant="danger"
          onClick={() => accountDelete.request()}
          iconLeft={<Trash2 className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Delete My Account
        </Button>
      </Card>

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