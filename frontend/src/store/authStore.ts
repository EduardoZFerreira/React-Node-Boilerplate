import { create } from "zustand";

import * as authApi from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import { queryClient } from "../queryClient";
import type { AuthUser } from "../types/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
  clearMustResetPassword: () => void;
}

// NOTE: this store mirrors the backend's session for UI convenience (nav
// visibility, route guards). It is never the source of truth for access
// control — every request is re-checked by the backend regardless of what
// this store thinks the user's roles are.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  init: async () => {
    set({ status: "loading" });
    try {
      const user = await authApi.me();
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, status: "anonymous" });
    }
  },

  login: async (email, password) => {
    await authApi.login({ email, password });
    // POST /login only returns { userId } — roles/tenantId come from /me.
    const user = await authApi.me();
    // Guards against any cached data from a previous session (e.g. another
    // account logged in earlier in this tab) briefly flashing on screen
    // before the first fetch for the new user resolves.
    queryClient.clear();
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.clear();
      set({ user: null, status: "anonymous" });
    }
  },

  clear: () => {
    queryClient.clear();
    set({ user: null, status: "anonymous" });
  },

  // Lets the forced-reset gate lift immediately after a successful
  // change-password, without needing a fresh /me round trip or re-login.
  clearMustResetPassword: () =>
    set((state) => (state.user ? { user: { ...state.user, mustResetPassword: false } } : {})),
}));

setUnauthorizedHandler(() => {
  useAuthStore.getState().clear();
});
