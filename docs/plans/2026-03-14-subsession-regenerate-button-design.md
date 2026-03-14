# Sub-session Regenerate Button Design

**User Intent:** In the sub-session dialog, every assistant reply should show the same `Regenerate` action as the main chat window, placed beside the existing `Copy` action.

## Scope
- In scope:
- Show `Regenerate` on every assistant reply in the sub-session overlay, matching the main window behavior.
- Keep the existing `Copy` action and ordering.
- Disable regeneration while the sub-session is already generating.
- Reuse the existing session-level regenerate flow.
- Out of scope:
- Changing regenerate behavior in the main chat window.
- Adding regenerate to user replies.
- Changing sub-session send, stop, or context-mode behavior.

## Approach Options
1. Reuse the main-window regenerate dispatch from `FloatingOverlay`.
- Pros: consistent behavior, minimal new logic, keeps replay flow in the existing saga.
- Cons: requires the overlay toolbar config to grow from one action to two.

2. Add a sub-session-specific regenerate path inside `FloatingOverlay`.
- Pros: isolated overlay code path.
- Cons: duplicates session replay logic and risks drifting from the main window.

## Recommendation
Choose option 1. `FloatingOverlay` should dispatch the same `regenerateMessage({ sessionId, messageId })` action used by `MessageItem`, so sub-session assistant replies stay behaviorally aligned with the main window.

## Data Flow
1. `FloatingOverlay` renders a `TurnToolbar` for each assistant reply that already has turn markdown.
2. Toolbar includes `Copy` and `Regenerate`, matching the main window labels and disabled state.
3. Clicking `Regenerate` dispatches `regenerateMessage` with the sub-session id and the assistant message id.
4. Existing saga logic removes the targeted assistant reply and replays generation from the preceding user turn.

## Testing Strategy
- Add an overlay rendering test that assistant replies expose both `Copy` and `Regenerate`.
- Add an overlay rendering test that user replies do not expose `Regenerate`.
- Run the overlay test file, then the full test suite and production build.
