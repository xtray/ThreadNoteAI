# Sidebar Text Clipping Design

**User Intent:** Fix the left sidebar chat/note list text so it remains fully readable with single-line ellipsis in browsers that currently clip or occlude the rendered text.

## Scope
- In scope:
- Preserve the current single-line sidebar layout for chat and note results.
- Fix browser-specific clipping issues for plain labels and highlighted search segments.
- Keep existing title tooltips and search behavior unchanged.
- Out of scope:
- Adding sidebar resize interactions.
- Switching the sidebar list to multi-line cards.
- Changing search/snippet generation logic.

## Root Cause
- Sidebar result rows are rendered as buttons with `overflow: hidden` and `text-overflow: ellipsis`.
- The visible label is split into multiple inline `<span>` nodes for search highlights.
- In some browsers, inline children inside an overflow-clipped control do not consistently shrink or paint within the button's available width, especially when the parent sits in a flex layout.
- The result is partial occlusion instead of a clean ellipsis.

## Approach Options
1. Keep the single-line layout and harden the truncation constraints.
- Pros: minimal behavioral change, lowest regression risk, preserves current density.
- Cons: requires careful CSS constraints on both the button and the highlight spans.

2. Switch result rows to two-line truncation.
- Pros: more text visible in many cases.
- Cons: changes layout density and selection rhythm, still depends on browser-specific line clamp behavior.

3. Remove truncation and allow full wrapping.
- Pros: no text clipping.
- Cons: sidebar height becomes unstable and scanning becomes slower.

## Recommendation
Use option 1. Keep the existing one-line list design and make the rendering structure browser-safe by introducing an explicit inner label wrapper and min-width-safe truncation rules.

## UI Structure
1. Each sidebar result button keeps its existing click and context-menu behavior.
2. The visible text moves into a dedicated child wrapper such as `.history-item-label`.
3. The wrapper owns the single-line truncation behavior.
4. Highlight spans remain inside the wrapper and inherit the truncated inline flow.

## CSS Rules
- Keep the button itself aligned and clickable across the full row width.
- Add `display: block` and `min-width: 0` to the text wrapper so it can shrink inside flex/grid/browser-specific layout calculations.
- Keep `white-space: nowrap`, `overflow: hidden`, and `text-overflow: ellipsis` on the wrapper rather than relying on the button alone.
- Ensure highlight spans render inline and do not create independent width constraints.

## Testing Strategy
- Add a UI regression test around sidebar rendering in `App.tsx`.
- Verify both chat and note results render the dedicated truncation wrapper.
- Verify highlighted search matches remain inside that wrapper so the browser-safe structure is preserved.
- Run the targeted test, then the full test suite, then the production build.

## Risks And Mitigations
- Risk: moving truncation responsibility from the button to an inner wrapper could affect active/hover styling.
- Mitigation: keep visual button styles unchanged and scope the new class to text layout only.
- Risk: the fix could cover only one of chat or note lists.
- Mitigation: both list types share the same result row structure, and the regression test should cover both code paths.
