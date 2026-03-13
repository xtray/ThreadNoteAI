# Sub-session Dual Resize Handles Design

**User Intent:** Keep the existing non-fullscreen sub-session resize affordance and add the same resize affordance at the bottom-left corner so the dialog can also be resized from there.

## Options considered

1. Add a second bottom-left resize handle and extend the current drag math to support both corners.
- Pros: smallest behavior change, preserves the existing top corner interaction, and matches the requested visual style.
- Cons: requires a small amount of directional resize logic.

2. Replace the current corner-specific handle with a full-height left-edge resize strip.
- Pros: easier to discover.
- Cons: changes the current interaction and visual affordance more than requested.

3. Move the only handle from the existing corner to the new corner.
- Pros: minimal code.
- Cons: removes current behavior and does not satisfy the request to support both corners.

## Recommendation

Choose option 1. Render a second resize handle in the bottom-left corner, reuse the same base handle styling, and switch the resize math based on which corner started the drag.

## Design

- Keep non-fullscreen behavior only; fullscreen should continue to hide resize handles.
- Preserve the existing top-left handle size, cursor, and placement.
- Add a bottom-left handle with the same visual treatment and mirrored placement.
- When dragging from the top-left handle, keep the current behavior: width grows as the pointer moves left and height grows as the pointer moves up.
- When dragging from the bottom-left handle, keep width behavior the same but invert height math so height grows as the pointer moves down.

## Testing

- Add a focused render test that asserts both resize handles are present in non-fullscreen mode.
- Run the targeted floating overlay test file after the test and implementation changes.
