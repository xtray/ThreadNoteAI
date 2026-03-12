# Selection Floating Actions Design

**User Intent:** When the user selects text inside an assistant reply, the floating selection control should become a compact two-icon menu. The first icon opens the existing sub-session flow and shows a hover tooltip. The second icon copies the current selected text.

## Approach Options

1. Rework the existing floating selection button into a two-action pill menu.
   Recommendation because it preserves the current selection detection, positioning, and sub-session creation flow while adding copy with minimal surface area.

2. Extract the floating selection UI into a standalone overlay component.
   Rejected for this task because it increases the refactor scope without changing the underlying selection model.

## Approved Design

- Keep the current assistant-message text-selection trigger and positioning logic in `MessageItem`.
- Replace the single `Sub-session` text button with a compact pill containing two icon-only buttons.
- The first button reuses the existing sub-session creation handler and exposes the tooltip text `Create sub-session dialog`.
- The second button copies the currently selected text by reusing `copyTextToClipboard` with the trimmed `selectedText` already stored in component state.
- Preserve the existing guard that prevents mouse interactions on the floating selection UI from clearing the selection state before the action fires.
- Leave copy success as a silent action for now; the requirement only changes the available action, not the feedback model.

## Error Handling

- If there is no trimmed selected text, the copy action is a no-op.
- If clipboard access fails, the existing fallback path in `copyTextToClipboard` remains responsible for graceful failure handling.

## Testing

- Add a focused regression test for the new floating action descriptors so the tooltip text and copy intent are locked down.
- Add a rendering test for assistant messages to ensure the floating menu exposes two icon-only actions rather than the old text button contract.
