# Selection Floating Copy Feedback Design

**User Intent:** After clicking the selection popup's copy action, the button should behave like the existing assistant reply copy action: switch to a check icon, show `Copied`, and then dismiss the whole floating selection bubble after a short delay.

## Approach Options

1. Add a local copied state to `MessageItem` and let the selection action helper render either the default copy icon or the temporary copied state.
   Recommendation because it keeps the transient timing logic beside the popup visibility state and reuses the existing clipboard helper.

2. Move the copy-success timing into the selection action helper itself.
   Rejected because the helper is currently stateless and would need to own popup dismissal that really belongs to `MessageItem`.

## Approved Design

- Track a `copiedSelection` boolean in `MessageItem` alongside the current selection popup state.
- When copy succeeds:
  - change the copy action icon from copy to check,
  - render the button label `Copied`,
  - keep the sub-session action unchanged,
  - start a `1500ms` timer that hides the selection popup and clears the highlight rectangles.
- If copy fails, keep the default copy button appearance and keep the popup visible.
- Reset the copied state whenever a new text selection is created or the popup is otherwise dismissed.

## Testing

- Extend the floating selection action tests to cover the copied visual state.
- Verify the assistant copy toolbar behavior still stays independent from the selection popup copy feedback.
