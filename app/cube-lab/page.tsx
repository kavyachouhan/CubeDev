import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabDashboard from "@/components/CubeLabDashboard";

export default function CubeLabPage() {
  return (
    <ProtectedRoute>
      <CubeLabDashboard />
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Cube Lab | CubeDev",
  description:
    "Discover tools and features in Cube Lab to enhance your speedcubing experience.",
};