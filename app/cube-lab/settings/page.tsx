import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="settings">
        <div className="p-8 text-center text-[var(--text-secondary)]">
          Settings coming soon...
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Settings | Cube Lab | CubeDev",
  description: "Customize your CubeDev experience with personalized settings.",
};