import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

// App.tsx already blocks rendering until the session bootstrap (`init()`)
// resolves, so by the time this runs `status` is either "authenticated" or
// "anonymous" — never "idle"/"loading".
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
