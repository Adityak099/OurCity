import { Suspense } from "react";

import ProtectedRoute from "../../../../components/auth/ProtectedRoute";
import ComplaintList from "../../../../components/citizen/ComplaintList";

export default function MyComplaintsPage() {
  return (
    <ProtectedRoute allowedRole="citizen">
      <Suspense
        fallback={<div className="auth-loading">Loading complaints...</div>}
      >
        <ComplaintList />
      </Suspense>
    </ProtectedRoute>
  );
}
