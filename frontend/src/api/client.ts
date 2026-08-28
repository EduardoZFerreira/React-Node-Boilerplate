import axios from "axios";

import { ApiError } from "../types/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Cookie-based session auth has no refresh-token flow to intercept: the browser
// resends the "sid" cookie automatically, and the server extends the rolling
// idle timeout on its own. This callback only handles the "session expired /
// was revoked mid-use" case, injected by the auth store to avoid a module cycle.
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

// Endpoints where a 401 is an expected, normal outcome (not a "session died" signal).
const AUTH_ENDPOINTS = ["/login", "/me"];

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(new ApiError(0, ["Network error — is the backend running?"]));
    }

    const { status, data, config } = error.response;
    const isAuthEndpoint = AUTH_ENDPOINTS.includes(config.url ?? "");
    if (status === 401 && !isAuthEndpoint) {
      unauthorizedHandler?.();
    }

    const errors =
      Array.isArray((data as { errors?: unknown })?.errors) && (data as { errors: string[] }).errors.length > 0
        ? (data as { errors: string[] }).errors
        : ["Something went wrong"];

    return Promise.reject(new ApiError(status, errors));
  },
);
