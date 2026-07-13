const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const appConfig = {
  apiUrl: (configuredApiUrl || "http://localhost:3000").replace(/\/$/, ""),
} as const;
