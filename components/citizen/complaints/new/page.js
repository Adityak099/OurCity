import ProtectedRoute from "../../../../../components/auth/ProtectedRoute";
import ComplaintForm from "../../../../../components/citizen/ComplaintForm";

export default function NewComplaintPage() {
  return (
    <ProtectedRoute allowedRole="citizen">
      <ComplaintForm />
    </ProtectedRoute>
  );
}
