import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function TrainingPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="training">
        <div className="p-8 text-center text-[var(--text-secondary)]">
          Training coming soon...
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Training | Cube Lab | CubeDev",
  description: "Skill improvement modules and training programs in Cube Lab.",
};