# Scilab Mobile

Expo SDK 54 foundation for the Scilab mobile frontend. No product UI or auth
feature has been implemented on this branch.

## Local setup

```powershell
corepack pnpm install --frozen-lockfile
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
corepack pnpm --filter mobile start
```

Set `EXPO_PUBLIC_API_URL` to an address reachable from the target device. For an
Android emulator, `localhost` usually needs to be replaced with `10.0.2.2`.

## Structure

```text
app/                    Expo Router routes and layouts only
src/features/           Feature-owned code added by later feature branches
src/providers/          Application-level providers
src/shared/             Axios client, API types and environment config
```

The app calls only the Scilab API. Provider-specific APIs, database credentials
and ingestion logic must not be placed in the mobile bundle.

## Networking foundation

- Axios owns base URL, timeout and API error normalization.
- TanStack Query owns server-state cache, mutations and retry policy.
- Future feature adapters use `apiRequest`; screens must not call Axios directly.
- Auth belongs to a separate feature branch.
