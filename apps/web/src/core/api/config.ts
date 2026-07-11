const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiConfig = {
  apiUrl: (configuredApiUrl || "http://localhost:6003").replace(/\/$/, ""),
  requestTimeoutMs: 15_000,
} as const;
