import { Suspense } from "react";
import ComplaintList from "@/components/citizen/ComplaintList";

export default function MyComplaintsPage() {
  return <Suspense fallback={<div className="auth-loading">Loading spot report…</div>}><ComplaintList /></Suspense>;
}
