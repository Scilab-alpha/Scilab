# Data Model: CI Pipeline

This feature does not introduce persisted application data. The model below
defines configuration and runtime concepts used to design tasks and acceptance
checks.

## Proposed Change

Represents a pull request or protected-branch update that must receive CI
validation.

- `sourceRef`: Branch or commit reference being validated.
- `targetRef`: Protected branch or review target.
- `changedAreas`: Repository areas affected by the change.
- `latestRevision`: Commit SHA used for the current validation run.
- `reviewStatus`: Current CI result shown to contributors and reviewers.

### Validation Rules

- A proposed change is merge-ready from a CI perspective only when every
  required validation group for its applicable areas passes.
- A newer revision supersedes older validation runs for the same proposed
  change.

## Validation Run

Represents one workflow execution for one proposed change or protected branch
update.

- `runId`: Unique workflow run identifier.
- `revision`: Commit SHA validated by the run.
- `status`: `pending`, `passed`, `failed`, `cancelled`, or `unavailable`.
- `startedAt`: Time validation began.
- `finishedAt`: Time validation ended, when available.
- `groups`: Validation group results included in the run.

### State Transitions

```text
pending -> passed
pending -> failed
pending -> cancelled
pending -> unavailable
```

### Validation Rules

- A cancelled run must not mark the proposed change as failed if a newer run is
  active for the same proposed change.
- An unavailable run must expose whether the failure was infrastructure-related
  or command-related.

## Validation Group

Represents a required check category for a repository area.

- `area`: `apps/web`, `apps/mobile`, `services/api`, or `packages/*`.
- `name`: `format`, `lint`, `typecheck`, `build`, `test`, or `migrate-deploy`.
- `required`: Whether the group must pass for the applicable area.
- `script`: Local command contributors can run to reproduce the group.
- `availability`: `available`, `not-declared`, or `not-applicable`.

### Required Coverage

| Area | Required Groups |
|------|-----------------|
| `apps/web` | format, lint, typecheck, build, test if available |
| `apps/mobile` | format, lint, typecheck, test if available |
| `services/api` | format, lint, typecheck, build, test, migrate deploy |
| `packages/*` | format, lint, typecheck, test if available |

### Validation Rules

- A group listed as required must either have a CI-safe script or be documented
  as intentionally unavailable with a follow-up owner before implementation is
  considered complete.
- Format and lint scripts used by CI must not modify files.

## Review Status

Represents the CI result visible on the review surface.

- `state`: `pending`, `passed`, `failed`, or `unavailable`.
- `summary`: Human-readable result summary.
- `failedGroup`: Failed validation group when available.
- `diagnosticLink`: Link to logs for the relevant group.

### Validation Rules

- Failed runs must identify the failed validation group.
- Secrets, tokens, and private configuration must not appear in summaries or
  diagnostics.
