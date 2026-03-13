# Package User Manual Design

**User Intent:** Refine the packaged English and Chinese readmes so they read like end-user operating manuals rather than delivery notes.

## Scope
- In scope:
- Rewrite the packaged readmes in a more guided, task-oriented style for end users.
- Add explicit Edge developer mode installation steps.
- Add a recommended first-use workflow.
- Add upgrade/reinstall instructions for replacing an unpacked extension.
- Keep troubleshooting and safety guidance short and practical.
- Out of scope:
- Changing the packaging mechanism itself.
- Adding screenshots or image assets.
- Changing repository root developer documentation.

## Approach Options
1. Add a few extra paragraphs to the current packaged readmes.
- Pros: smallest diff.
- Cons: still reads like a release note instead of an operating manual.

2. Reframe both packaged readmes around user tasks and common scenarios.
- Pros: clearer for non-technical recipients, easier to follow step by step, better fit for private distribution.
- Cons: requires a fuller doc rewrite.

3. Split the docs into quick start and advanced guides.
- Pros: cleaner information separation.
- Cons: too much structure for a small offline package.

## Recommendation
Choose option 2. A single, well-structured user manual in each language gives recipients one place to look for installation, first-use setup, normal operation, backup habits, and upgrade steps.

## Content Design
- Lead with what the extension is and what the package contains.
- Add a dedicated `Install in Edge (Developer Mode)` section with numbered steps.
- Add a `Recommended First-Use Flow` section with a short path from install to first successful chat.
- Keep feature sections focused on user actions: main chat, sub-sessions, notebook, import/export.
- Add an `Update to a New Version` section that explains how to replace an unpacked installation safely.
- End with concise troubleshooting and safety notes.

## Testing Strategy
- Extend the packaged readme test coverage to assert the presence of the new user-manual section headings in both source docs.
- Run the focused test first to watch it fail.
- After updating the docs, run the full verification path and inspect the packaged zip to confirm both updated manuals are included.
