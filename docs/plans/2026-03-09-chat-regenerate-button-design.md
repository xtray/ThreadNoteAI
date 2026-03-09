# Chat Regenerate Button Design

**User Intent:** In the AI chat page, some model replies stop midway and leave incomplete output visible. Add a `Regenerate` button beside the existing copy action at the end of every assistant reply so the user can discard the current reply text and regenerate from the same user question.

## Scope
- In scope:
- Show a `Regenerate` toolbar action on every assistant turn.
- On click, remove the current assistant reply and regenerate from the preceding user message in the same session.
- Reuse the current session model configuration, including root multi-model selection behavior.
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
Choose option 1. Introduce a dedicated regenerate action that targets a specific assistant message, removes it from session state, finds the matching previous user prompt, and then reuses the existing send pipeline to create a fresh assistant reply.

## Data Flow
1. `MessageItem` renders a `Regenerate` action for assistant messages in `TurnToolbar`.
2. Button click dispatches `sessions/regenerateMessage` with `sessionId` and `messageId`.
3. Saga looks up the targeted assistant message and the nearest previous user message in the same session.
4. Reducer removes the targeted assistant message before new generation starts.
5. Saga re-enters the existing send flow with the recovered user content and current session model configuration.
6. Root multi-model sessions create a new round and assistant message as usual; sub-sessions reuse their single-model flow.

## Error Handling
- If the target message is missing or has no preceding user turn, regeneration is ignored.
- If the session is already loading, regeneration is ignored and the button is disabled in UI.
- If the regenerated request fails, existing error rendering remains unchanged through the current send pipeline.

## Testing Strategy
- Toolbar rendering test: assistant turns show `Regenerate`; user turns do not.
- Reducer test: removing a targeted assistant message only removes that message.
- Saga test: regenerate resolves the previous user prompt and re-dispatches the current send flow.
- Verification: targeted tests, full test suite, and production build.

## Risks and Mitigations
- Risk: regenerating a historical assistant turn could replay against later conversation context.
- Mitigation: use the same session message list after removing the targeted assistant reply, so the replay reflects the retained conversation state deterministically.
- Risk: root multi-model rounds could leave stale round metadata.
- Mitigation: remove only the assistant message; round projection already follows message presence and a new send creates a fresh round.
