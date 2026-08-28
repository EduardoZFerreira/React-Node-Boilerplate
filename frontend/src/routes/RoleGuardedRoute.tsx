import type { ReactNode } from "react";

import { ForbiddenPage } from "../pages/errors/ForbiddenPage";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/auth";

interface RoleGuardedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

// UX convenience only, same as every other guard in this folder: it hides
// screens the user's role can't use, but the backend re-checks every request
// regardless of what this store thinks the user's roles are.
export function RoleGuardedRoute({ allowedRoles, children }: RoleGuardedRouteProps) {
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return <ForbiddenPage />;
  }

  return children;
}
