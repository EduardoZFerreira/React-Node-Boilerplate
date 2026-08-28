import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { AdminTenantFormPage } from "../pages/admin/AdminTenantFormPage";
import { AdminTenantsListPage } from "../pages/admin/AdminTenantsListPage";
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage";
import { AdminUsersListPage } from "../pages/admin/AdminUsersListPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { NotFoundPage } from "../pages/errors/NotFoundPage";
import { ItemFormPage } from "../pages/items/ItemFormPage";
import { ItemsListPage } from "../pages/items/ItemsListPage";
import { LandingPage } from "../pages/landing/LandingPage";
import { TenantCreateUserPage } from "../pages/tenant/TenantCreateUserPage";
import { TenantUsersListPage } from "../pages/tenant/TenantUsersListPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { RoleGuardedRoute } from "./RoleGuardedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route
          path="login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="items" replace />} />
        <Route path="items" element={<ItemsListPage />} />
        <Route path="items/new" element={<ItemFormPage />} />
        <Route path="items/:id/edit" element={<ItemFormPage />} />

        <Route
          path="tenant/users"
          element={
            <RoleGuardedRoute allowedRoles={["Admin", "TenantManager"]}>
              <TenantUsersListPage />
            </RoleGuardedRoute>
          }
        />
        <Route
          path="tenant/users/new"
          element={
            <RoleGuardedRoute allowedRoles={["Admin", "TenantManager"]}>
              <TenantCreateUserPage />
            </RoleGuardedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <RoleGuardedRoute allowedRoles={["Admin"]}>
              <AdminUsersListPage />
            </RoleGuardedRoute>
          }
        />
        <Route
          path="admin/users/:id"
          element={
            <RoleGuardedRoute allowedRoles={["Admin"]}>
              <AdminUserDetailPage />
            </RoleGuardedRoute>
          }
        />
        <Route
          path="admin/tenants"
          element={
            <RoleGuardedRoute allowedRoles={["Admin"]}>
              <AdminTenantsListPage />
            </RoleGuardedRoute>
          }
        />
        <Route
          path="admin/tenants/new"
          element={
            <RoleGuardedRoute allowedRoles={["Admin"]}>
              <AdminTenantFormPage />
            </RoleGuardedRoute>
          }
        />
        <Route
          path="admin/tenants/:id/edit"
          element={
            <RoleGuardedRoute allowedRoles={["Admin"]}>
              <AdminTenantFormPage />
            </RoleGuardedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
