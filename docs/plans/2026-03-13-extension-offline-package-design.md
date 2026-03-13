# Extension Offline Package Design

**User Intent:** Add a repeatable offline distribution flow for the Edge extension so limited users can install it without publishing to the browser store.

## Scope
- In scope:
- Add a local `npm run pack` command that builds the extension and produces a distributable zip file.
- Name the package from the extension version so local builds and CI artifacts stay aligned.
- Add a GitHub Actions workflow that runs on pushed tags, builds the project, creates the zip package, and uploads it as a downloadable artifact.
- Document the packaging flow in the project README.
- Out of scope:
- Generating signed `crx` packages.
- Publishing to the Chrome Web Store or Edge Add-ons store.
- Auto-creating GitHub Releases unless the project later asks for it.

## Approach Options
1. Ask users to distribute the raw `dist/` directory only.
- Pros: no extra scripting.
- Cons: awkward to share, easy to corrupt, and inconsistent with CI artifact distribution.

2. Add a repository-owned pack script that zips `dist/` after build and reuse it in GitHub Actions.
- Pros: one packaging path for local and CI use, low maintenance, easy to document, and matches the offline install workflow.
- Cons: requires a small helper script and CI workflow setup.

3. Generate `crx` packages directly.
- Pros: looks closer to a single-file install artifact.
- Cons: signing and browser restrictions make private offline distribution harder, not easier.

## Recommendation
Choose option 2. A zip file is the simplest stable distribution format for a private Edge extension rollout. Users can download one file, unzip it, and load the unpacked extension in `edge://extensions`, while the project keeps the same packaging logic locally and in CI.

## Packaging Design
- `npm run pack` should:
- Run the normal production build first.
- Read the package version from `package.json`.
- Create `artifacts/ThreadNoteAI-v<version>.zip`.
- Zip the contents of `dist/` rather than nesting the whole `dist` folder, so the extracted result can be selected directly in Edge.

- The pack script should stay dependency-light:
- Prefer built-in Node.js modules for file system checks and process execution.
- Use the platform zip tool (`zip` on macOS/Linux, PowerShell `Compress-Archive` on Windows) instead of adding a new npm dependency.

## CI Design
- Add a workflow triggered by pushed tags.
- Use Node 20 for install, test, build, and pack steps.
- Run `npm ci`, then project tests, then `npm run pack`.
- Upload the generated zip from `artifacts/`.
- The artifact name should include the git tag so each run is easy to identify in GitHub Actions.

## Testing Strategy
- Add unit tests for the pack script helpers that compute archive names and validate the `dist/` input path.
- Run the targeted test first and confirm it fails before implementation.
- After implementation, run the targeted test plus the full existing test suite used by the repository.
- Run `npm run build` and `npm run pack` locally to verify the produced zip path and contents.

## Risks And Mitigations
- Risk: local packaging may fail on a machine without the expected zip command.
- Mitigation: support both Unix `zip` and Windows PowerShell archiving, and emit a clear error when neither path is available.

- Risk: CI and local packaging could diverge.
- Mitigation: make GitHub Actions call the same `npm run pack` command used locally.

- Risk: zip contents might wrap everything inside an extra `dist/` folder.
- Mitigation: package the contents of `dist/` directly and verify the archive listing during local validation.
