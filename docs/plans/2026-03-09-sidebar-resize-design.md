# Sidebar Resize Design

**User Intent:** Let the left AI/Notebook sidebar support dragging with the left mouse button to adjust width horizontally, and keep the chosen width after page refresh.

## Scope
- In scope:
- Add a draggable resize handle between the left sidebar and main content.
- Support live horizontal resizing with the mouse primary button.
- Persist the chosen width locally so it survives refresh.
- Keep both AI and Notebook modes using the same sidebar width.
- Out of scope:
- Resizing the right content pane independently.
- Different saved widths per mode.
- Touch gesture support.

## Approach Options
1. Use native CSS `resize: horizontal` on the sidebar.
- Pros: very small code change.
- Cons: limited control over handle appearance, inconsistent constraints, still needs extra persistence logic.

2. Manage width in React state and render a dedicated resize handle.
- Pros: precise control over drag behavior, min/max width, persisted state, and visual feedback.
- Cons: requires pointer event wiring and a bit more CSS.

3. Introduce a generic split-pane abstraction.
- Pros: reusable for future resizable layouts.
- Cons: heavier than current needs and adds abstraction before a second use case exists.

## Recommendation
Choose option 2. The feature is local to the root layout, persistence is straightforward, and we can clamp width to protect the main workspace without introducing a generic layout abstraction too early.

## Interaction Design
- A narrow vertical handle sits between the sidebar and the main workspace.
- Pressing the primary mouse button on the handle starts a resize drag.
- Moving horizontally updates the sidebar width immediately.
- Releasing the pointer ends the drag and keeps the final width.
- Width is clamped to a minimum usable sidebar width and a maximum based on the viewport width so the main area remains visible.
- Refresh restores the last valid width from local storage.

## State And Persistence
- Keep sidebar width as local UI state in `App.tsx`.
- Store the persisted width in `localStorage` under a dedicated key.
- On startup, load and sanitize the stored width before seeding state.
- Persist sanitized width after drag completion so invalid stored values cannot accumulate.
- Do not route this through Redux because the value is layout-local and does not participate in cross-component business state.

## Visual Design
- Preserve the current glassmorphism sidebar surface and main panel layout.
- Use a slim invisible-to-subtle resize strip that becomes more visible on hover and during drag.
- Show `col-resize` cursor on the handle and the document during active drag.
- Avoid strong colors so the control reads as structural chrome rather than content.

## Testing Strategy
- Add focused unit tests for helper logic that loads, sanitizes, and clamps sidebar width.
- Verify invalid persisted values fall back to the default width.
- Verify widths clamp at the configured minimum and viewport-derived maximum.
- Rely on the helper tests plus build/test verification instead of brittle drag-DOM tests for this iteration.

## Risks And Mitigations
- Risk: users can shrink the main workspace too aggressively.
- Mitigation: clamp the maximum sidebar width relative to viewport width.
- Risk: global move/up listeners could leak if not cleaned up.
- Mitigation: attach listeners only while dragging and always remove them in cleanup.
- Risk: text selection during drag feels messy.
- Mitigation: prevent default on drag start and apply a drag-active body cursor/state while resizing.
