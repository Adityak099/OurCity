import CollectionInfo from "@/components/collection/CollectionInfo";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminCollectionInfoPage() {
  return (
    <ProtectedRoute allowedRole="admin">
      <CollectionInfo manage />
    </ProtectedRoute>
  );
}
