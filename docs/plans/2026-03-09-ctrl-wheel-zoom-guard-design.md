# Ctrl+Wheel Zoom Guard Design

**User Intent:** Match ChatGPT by making `Ctrl + mouse wheel` do nothing inside the left sidebar and the right main workspace instead of triggering application or page zoom behavior.

## Scope
- In scope:
- Block `Ctrl + wheel` on the left AI/Notebook sidebar container.
- Block `Ctrl + wheel` on the right main workspace container so chat and notebook content behave the same way.
- Keep normal wheel scrolling unchanged.
- Add a focused regression test for the blocked gesture.
- Out of scope:
- Changing any text size or zoom scale.
- Intercepting every wheel event globally across the whole window.
- Reworking chat layout beyond the zoom guard.

## Approach Options
1. Attach `onWheel` handlers directly in React JSX.
- Pros: small code change and easy to read.
- Cons: relies on React's event system for cancellation timing and passive behavior.

2. Attach native `wheel` listeners with `{ passive: false }` to the sidebar and workspace containers.
- Pros: explicit non-passive listeners make `preventDefault()` reliable for browser zoom prevention.
- Cons: requires refs and effect cleanup.

3. Attach one global `window` wheel listener.
- Pros: broadest coverage.
- Cons: blocks more of the app than requested and risks surprising behavior in overlays or future panels.

## Recommendation
Choose option 2. The behavior should match a browser-level gesture guard, and native non-passive listeners on the two relevant containers give the narrowest scope with the most reliable cancellation semantics.

## Interaction Design
- Plain wheel input continues to scroll the hovered sidebar or workspace as before.
- `Ctrl + wheel` over the sidebar does nothing.
- `Ctrl + wheel` over the right workspace does nothing whether the user is in AI chat or notebook mode.
- No zoom indicator, toast, or fallback action is shown.

## Implementation Notes
- Add refs for the sidebar container and main workspace container in `App.tsx`.
- Register the same `wheel` listener on both elements inside an effect.
- In the listener, return early unless `event.ctrlKey` is true.
- Call `event.preventDefault()` when `Ctrl + wheel` is detected.
- Remove listeners in effect cleanup to avoid leaks.

## Testing Strategy
- Extend `src/App.test.tsx` with a DOM-based test that renders `App`.
- Dispatch cancelable wheel events against the sidebar and workspace containers.
- Verify `Ctrl + wheel` is `defaultPrevented`.
- Verify a normal wheel event is not prevented.

## Risks And Mitigations
- Risk: using React synthetic wheel events may not reliably cancel browser zoom.
- Mitigation: use native listeners with `{ passive: false }`.
- Risk: future layout refactors could move the relevant containers.
- Mitigation: keep the refs attached to the actual sidebar and workspace root nodes and cover them with a regression test.
