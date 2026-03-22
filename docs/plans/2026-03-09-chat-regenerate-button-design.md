# Chat Regenerate Button Design

**User Intent:** In the AI chat page, some model replies stop midway and leave incomplete output visible. Add a `Regenerate` button beside the existing copy action at the end of every assistant reply so the user can discard the current reply text and regenerate from the same user question.

## Scope
- In scope:
- Show a `Regenerate` toolbar action on every assistant turn.
- On click, regenerate from the preceding user message in the same session.
- Reuse the historical context up to the targeted assistant turn, not the later turns that appear below it in the chat.
- Reuse the current session model configuration, including root multi-model selection behavior.
- Warn that later turns may become stale after regenerating an earlier turn.
- Disable regeneration while the session is already generating.
- Out of scope:
- Automatic retry detection for partial outputs.
- Keeping multiple historical versions of the same assistant reply.
- Adding regenerate support to user turns or note excerpts.

## Approach Options
1. Add a dedicated regenerate session action handled in saga.
- Pros: keeps chat replay logic in one place, works for both single-model and root multi-model sessions, and avoids duplicating send logic in UI.
- Cons: needs a small reducer action and saga branch.

2. Reconstruct and resend directly from `MessageItem`.
- Pros: smaller apparent surface area.
- Cons: spreads session mutation and replay behavior into the component layer, making multi-model round behavior harder to reason about.

3. Keep the current assistant message and overwrite its content in place.
- Pros: fewer array mutations.
- Cons: mixes old and new lifecycle for the same message id and complicates round/tab state in root multi-model sessions.

## Recommendation
Choose option 1. Introduce a dedicated regenerate action that targets a specific assistant message, finds the matching previous user prompt, rebuilds model input from the conversation history before that assistant turn, and regenerates only that turn's reply state.

## Data Flow
1. `MessageItem` renders a `Regenerate` action for assistant messages in `TurnToolbar`.
2. Button click dispatches `sessions/regenerateMessage` with `sessionId` and `messageId`.
3. Saga looks up the targeted assistant message and the nearest previous user message in the same session.
4. Saga rebuilds model input from the historical session messages before the targeted assistant turn.
5. Regenerating an earlier turn does not include later turns beneath it in the prompt, so the regenerated answer reflects that earlier conversation state.
6. Root multi-model sessions regenerate only the selected round/tab reply for that turn; single-model sessions regenerate the targeted reply in place.
7. Later turns are left unchanged and may no longer match the regenerated earlier answer.

## Error Handling
- If the target message is missing or has no preceding user turn, regeneration is ignored.
- If the session is already loading, regeneration is ignored and the button is disabled in UI.
- If the regenerated request fails, existing error rendering remains unchanged.
- If the user regenerates an upper historical turn, show an inline warning on that message card that later turns may be stale.
- Keep the warning lightweight and temporary so it informs without blocking the regenerate action.

## Testing Strategy
- Toolbar rendering test: assistant turns show `Regenerate`; user turns do not.
- Saga test: regenerate resolves the previous user prompt and rebuilds context only up to the targeted turn.
- Saga test: root multi-model regenerate refreshes only the selected round/tab reply instead of starting a fresh round.
- Verification: targeted tests, full test suite, and production build.

## Risks and Mitigations
- Risk: users may expect an earlier-turn regenerate to also account for later turns.
- Mitigation: document clearly that regenerate uses historical context only up to the targeted turn.
- Risk: later turns can become stale after an earlier turn is regenerated.
- Mitigation: warn that later turns may be stale and may need manual follow-up regeneration.
- Risk: root multi-model rounds could drift if regenerate re-enters the normal new-round flow.
- Mitigation: keep regenerate bound to the existing round/tab for the targeted turn.
