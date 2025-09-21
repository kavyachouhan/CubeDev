import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import CubeLabStats from "@/components/CubeLabStats";

export default function StatisticsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="statistics">
        <CubeLabStats />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}