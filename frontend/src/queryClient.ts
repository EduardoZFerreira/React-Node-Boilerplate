import { QueryClient } from "@tanstack/react-query";

// A single shared instance so it can be imported both by the app root (to
// wire the provider) and by the auth store (to clear cached data on
// logout/session-loss — see authStore.ts).
export const queryClient = new QueryClient();
