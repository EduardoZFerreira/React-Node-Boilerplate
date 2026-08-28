import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

// Keeps an already-authenticated user off /login and /register. This is a UX
// convenience only — as with every guard in routes/, the backend is what
// actually decides what a request is allowed to do.
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") {
    return <Navigate to="/app" replace />;
  }

  return children;
}
