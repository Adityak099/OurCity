"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && (!user || (allowedRole && user.role !== allowedRole))) {
      const roleRoutes = {
        citizen: "/citizen/dashboard",
        admin: "/admin/dashboard",
        driver: "/driver/dashboard",
      };

      router.replace(
        user
          ? roleRoutes[user.role] || "/login"
          : `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
  }, [user, ready, allowedRole, router]);

  if (!ready || !user || user.role !== allowedRole) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Checking your access...</p>
      </div>
    );
  }

  return children;
}
