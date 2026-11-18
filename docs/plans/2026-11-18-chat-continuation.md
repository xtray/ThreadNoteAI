# Chat continuation implementation plan

**Goal:** Continue token-limited streaming replies automatically.
**Architecture:** Retain single-request transport and add a continuation coordinator. Capture provider stop reasons in shared parser state and JSON fallback.
**Tech Stack:** TypeScript, Vitest, fetch, Chrome extension ports.

1. Add parameterized regression tests in src/utils/api.test.ts for three provider SSE termination reasons and JSON fallback; run npm test -- src/utils/api.test.ts and confirm failure.
2. Update src/utils/api.ts to capture stop reasons, wrap single-request transport, accumulate output and continuation context, and forward cancellation. Reject no-progress and excessive continuations.
3. Test normal stop, cancellation, errors and safety guards. Run npm test and npm run build. Inspect git diff --check and review final diff.
