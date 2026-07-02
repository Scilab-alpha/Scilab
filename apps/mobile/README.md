# Scilab Mobile

Expo SDK 54 foundation for the Scilab mobile frontend, organized around Expo
Router routes, feature folders, TanStack Query, Zustand auth state, and
SecureStore-backed sessions.

## Local setup

```powershell
corepack pnpm install --frozen-lockfile
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
corepack pnpm --filter mobile start
```

Keep real environment values in `apps/mobile/.env.local` or `apps/mobile/.env`.
Those files are ignored by git. Set `EXPO_PUBLIC_API_URL` to an address
reachable from the target device. For an Android emulator, `localhost` usually
needs to be replaced with `10.0.2.2`.

Use the API host as the base URL without adding an `/api/v1` suffix. The
current API routes are exposed directly under `/auth` and `/users`.

## Structure

```text
app/                    Expo Router routes and layouts only
src/components/         App-wide reusable UI and brand components
src/features/           Feature-owned screens, components, hooks and services
src/lib/                App libraries such as query client and secure storage
src/services/           Shared API client and response normalization
src/store/              Zustand stores for app state
src/theme/              Shared visual tokens
```

The app calls only the Scilab API. Provider-specific APIs, database credentials
and ingestion logic must not be placed in the mobile bundle.

## Networking foundation

- `src/services/api.ts` owns base URL, timeout and API error normalization.
- TanStack Query owns server-state cache, mutations and retry policy.
- Feature API adapters use `apiRequest`; screens should not call `fetch`
  directly.
- Auth tokens live in Zustand state and are persisted with Expo SecureStore when
  the user chooses "remember me".
