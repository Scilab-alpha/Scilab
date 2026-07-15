const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiConfig = {
  // Prefer `/backend` (Next.js rewrite) so browser requests stay same-origin.
  apiUrl: (configuredApiUrl || "/backend").replace(/\/$/, ""),
  requestTimeoutMs: 15_000,
} as const;
