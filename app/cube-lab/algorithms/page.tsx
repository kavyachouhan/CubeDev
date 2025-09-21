import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function AlgorithmsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithms">
        <div className="p-8 text-center text-[var(--text-secondary)]">
          Algorithms coming soon...
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Algorithms | Cube Lab | CubeDev",
  description: "Algorithm practice and learning modules in Cube Lab.",
};