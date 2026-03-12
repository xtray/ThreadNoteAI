# Selection Floating Layout Tuning Design

**User Intent:** The selection floating bubble should feel slimmer and more balanced. The copy action should appear before the sub-session action, and the overall pill should be less tall.

## Approach Options

1. Reorder the existing actions in the helper and tighten only the relevant pill/button CSS.
   Recommendation because it keeps behavior unchanged and isolates the change to presentation.

2. Introduce a separate compact layout variant just for the selection bubble.
   Rejected because it adds indirection for a small visual adjustment.

## Approved Design

- Swap the action order so the copy action renders first and the sub-session action renders second.
- Reduce the floating pill height by tightening pill padding and icon button dimensions.
- Keep the `Copied` state visually consistent with the slimmer baseline by reducing its padding and height to match the rest of the pill.
- Leave all action titles, click handlers, and delay behavior unchanged.

## Testing

- Extend the floating action tests to assert the copy action remains first.
- Rely on the existing build/test pass for the style-only portions.
