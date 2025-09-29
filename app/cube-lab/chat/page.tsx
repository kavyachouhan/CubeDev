import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function Chat() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithms">
        <div className="p-8 text-center text-[var(--text-secondary)]">
          Chat coming soon...
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Chat | Cube Lab | CubeDev",
  description: "Chat functionality in Cube Lab.",
};