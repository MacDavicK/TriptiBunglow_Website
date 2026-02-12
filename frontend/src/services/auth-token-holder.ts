/**
 * Module-level token holder so api.ts (no React) can read the access token.
 * AuthContext sets this on login/refresh and clears on logout.
 */
let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnUnauthenticated(fn: (() => void) | null): void {
  onUnauthenticated = fn;
}

export function triggerUnauthenticated(): void {
  onUnauthenticated?.();
}
