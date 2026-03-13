# Package Trial User Manual Design

**User Intent:** Refine the packaged user manuals so they feel more suitable for a small trial-user rollout, including a compact install troubleshooting table.

## Scope
- In scope:
- Adjust the packaged English and Chinese manuals toward a trial-user tone.
- Add a short installation troubleshooting table in both manuals.
- Keep browser terminology such as `Developer mode` and `Load unpacked` where useful.
- Keep the manuals concise enough to ship inside the offline package.
- Out of scope:
- Changing packaging code or archive structure.
- Adding screenshots.
- Adding support contact workflows.

## Approach Options
1. Append a few extra troubleshooting bullets to the FAQ.
- Pros: very small change.
- Cons: users may miss the guidance because it is buried.

2. Add a dedicated compact install troubleshooting section and lightly retune the manual tone for trial users.
- Pros: easy to scan, directly addresses the install path, and keeps the document lightweight.
- Cons: requires a modest doc rewrite.

3. Add a full support section with escalation instructions.
- Pros: more complete handoff.
- Cons: too heavy for the current distribution scope.

## Recommendation
Choose option 2. Trial users most often fail during installation, so a dedicated short troubleshooting table gives them the fastest recovery path without turning the manual into a support document.

## Content Design
- Keep the existing install, first-use, workflow, and upgrade sections.
- Add `Install Troubleshooting` / `安装失败排查对照表`.
- Structure each row around:
- symptom
- likely cause
- what to try
- Make the wording friendly and direct, while keeping the accepted browser terms.

## Testing Strategy
- Extend the packaged readme test to assert the troubleshooting section title exists in both docs.
- Run the focused test first to confirm it fails.
- After the doc update, rerun the focused test and then full verification with pack output inspection.
