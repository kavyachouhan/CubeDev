import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function SessionsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="sessions">
        <div className="p-8 text-center text-[var(--text-secondary)]">
          Sessions coming soon...
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Sessions | Cube Lab | CubeDev",
  description: "Organized solving sessions to track your speedcubing practice in Cube Lab.",
};