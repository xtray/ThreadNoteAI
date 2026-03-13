# Extension Package Readmes Design

**User Intent:** Include clear end-user usage instructions inside the offline extension zip so recipients can install and use the product without opening the source repository.

## Scope
- In scope:
- Add two package-only documentation source files, one English and one Chinese.
- Copy those files into the packaged extension as `README.md` and `Readme-CN.md`.
- Keep the package docs focused on install, configuration, daily use, import/export, and troubleshooting.
- Validate the packaging helper logic that prepares these files before zipping.
- Out of scope:
- Replacing the repository root README files.
- Generating docs dynamically from application state.
- Localizing beyond English and Simplified Chinese.

## Approach Options
1. Copy the repository root `Readme.md` and `Readme-cn.md` directly into the package.
- Pros: least implementation work.
- Cons: mixes developer-facing and end-user-facing concerns, and the package text becomes harder to tailor.

2. Maintain dedicated package doc source files and let the pack script stage them into `dist/` before archiving.
- Pros: clear ownership, package docs stay user-focused, and filenames inside the zip can be controlled precisely.
- Cons: introduces two new source files to maintain.

3. Generate package docs from templates at build time.
- Pros: maximum flexibility.
- Cons: unnecessary complexity for a stable pair of docs.

## Recommendation
Choose option 2. Dedicated package documentation keeps the repository docs clean while letting the distributed zip include polished end-user instructions with the exact filenames requested.

## Content Design
- `README.md`:
- Explain what ThreadNote AI is.
- Explain Edge offline installation steps.
- Explain first-run setup for AI provider API keys.
- Summarize main chat, sub-session, and notebook workflows.
- Explain backup/import/export behavior.
- Include common troubleshooting notes.

- `Readme-CN.md`:
- Cover the same content in Chinese.
- Use wording aimed at end users rather than contributors.

## Packaging Design
- Store the source docs in a dedicated folder under the repository, separate from root readmes.
- Before zipping, the pack script copies:
- package English doc -> `dist/README.md`
- package Chinese doc -> `dist/Readme-CN.md`
- Archive `dist/` contents as before so the docs appear at the top level of the zip.

## Testing Strategy
- Extend the existing packaging helper test to verify the staged package doc filenames resolve correctly.
- Add a test that fails when a required package doc source file is missing.
- Run the targeted test first, then full test/build/pack verification, then inspect the zip listing to confirm both docs are present.

## Risks And Mitigations
- Risk: package docs drift from actual product behavior.
- Mitigation: write the docs from current app behavior and keep them as explicit source-controlled files that can be reviewed with code changes.

- Risk: the pack script mutates `dist/` in a way that leaves stale docs behind.
- Mitigation: copy the docs fresh on every pack run before creating the archive.
