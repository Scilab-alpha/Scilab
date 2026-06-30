<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/002-ci-pipeline/plan.md
<!-- SPECKIT END -->

## Working Principles

When the user asks to add or update a working principle, update this
`AGENTS.md` file only. Do not update Spec Kit files, constitution files,
templates, or application code unless the user explicitly asks for that.

When adding or changing any backend HTTP API endpoint, also update the
OpenAPI/Swagger contract in the same change. The contract must cover request
body, params/query, authentication, success response, failure responses, and
the standard response envelope.

For backend use cases, keep files separated by responsibility: request/response
DTOs in `*.dto.ts`, tests in `*.spec.ts`, and use case implementation in
`*.use-case.ts`.
