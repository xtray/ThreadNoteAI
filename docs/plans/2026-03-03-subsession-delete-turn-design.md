# Sub-session Turn Deletion Design

## Background
Current right-click delete-turn behavior exists only in main session user messages. Sub-session overlay only supports `Add to note` on assistant messages, so existing sub-session turns cannot be removed via right-click.

## Goal
Enable right-click deletion in sub-sessions, deleting the matched turn as a pair: current user prompt + its assistant reply.

## Scope
- Add right-click delete entry in sub-session overlay.
- Keep deletion pair semantics consistent for both user-side and assistant-side right-click.
- Ensure sub-session trees attached to deleted messages are still removed.

## Design
### 1. Pair resolution moved to reducer
`removeTurn` will accept a generic clicked `messageId` (not only user message id). Reducer resolves the owning user turn:
- If clicked message is user: use that message as turn root.
- If clicked message is assistant: locate nearest previous user message as turn root.
- Delete turn root user message and its immediate assistant reply (if any).

This centralizes pairing logic and avoids duplicating brittle assumptions in UI.

### 2. Sub-session overlay context menu
In `FloatingOverlay`:
- User message right-click => show `Delete turn`.
- Assistant message right-click => keep `Add to note`, and also show `Delete turn` for that assistant’s matched turn.

### 3. Compatibility
Main session existing behavior remains intact, because user right-click still dispatches `removeTurn`, only payload key changes from `userMessageId` to `messageId`.

## Error Handling
- If clicked message cannot map to a user turn, reducer no-op.
- If paired assistant is missing, delete only user message.

## Testing Strategy
- Add reducer tests proving `removeTurn` can delete by assistant message id.
- Verify user-message deletion behavior remains correct.
- Verify related annotated sub-session tree cleanup still works.
