# Sub-session Code Block Copy Design

**User Intent:** Sub-session overlay assistant replies should expose the same per-code-block copy button as the main chat view. User messages should not show the button.

## Approach Options

1. Pass the existing `enableCodeBlockCopy` prop from `FloatingOverlay` into `MessageContent`.
   Recommendation because `MessageContent` already owns the markdown code-block copy behavior, clipboard flow, and styling.

2. Add a dedicated overlay-only markdown renderer.
   Rejected because it duplicates logic and risks drift between main chat and sub-session rendering.

## Approved Design

- Reuse the existing code-block copy implementation in `MessageContent`.
- In the sub-session overlay, enable that behavior only for assistant messages with `enableCodeBlockCopy={m.role === 'assistant'}`.
- Add a regression test proving overlay assistant replies render the copy button while overlay user messages do not.
