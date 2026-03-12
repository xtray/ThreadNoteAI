# Sub-session Resize Handle Visual Design

**User Intent:** Remove the visible top-left resize triangle from the sub-session overlay, but keep the resize hotspot and `nwse-resize` cursor so resizing still works from the same corner.

## Options considered

1. Remove only the triangle pseudo-element and keep the existing resize handle element.
- Pros: smallest change, preserves behavior, keeps the hit area and cursor intact.
- Cons: no explicit visual affordance remains until hover reveals the cursor.

2. Remove the resize handle element entirely and rely on browser-native edge resizing.
- Pros: less custom DOM.
- Cons: changes behavior, likely breaks the current custom top-left drag interaction.

3. Replace the triangle with a subtler permanent indicator.
- Pros: preserves discoverability.
- Cons: does not match the requested behavior.

## Recommendation

Choose option 1. Keep the existing `.overlay-resize-handle` element and drag logic, but remove the pseudo-element styles that draw the triangle and its hover state. This satisfies the request while minimizing regression risk.

## Design

- Keep the top-left resize hotspot dimensions and absolute positioning unchanged.
- Keep the `nwse-resize` cursor on hover over that hotspot.
- Remove the visible triangle in both resting and hover states.
- Leave fullscreen behavior unchanged: the resize handle still renders only when the overlay is not fullscreen.

## Testing

- Add a focused render test to confirm the sub-session overlay still includes the resize handle in non-fullscreen mode.
- Run the targeted overlay test file after the CSS change.
