# Chat Settings Tabs Design

**User Intent:** Redesign the left AI chat settings panel so configuration is easier to scan and manage as settings continue to grow, using an industry-standard tabbed layout instead of one long appended form.

## Scope
- In scope:
- Reorganize the AI chat settings modal into top horizontal tabs.
- Group existing settings by task domain instead of one vertical form.
- Keep all current configuration capabilities available.
- Improve readability, visual hierarchy, and future extensibility.
- Out of scope:
- Adding new backend settings.
- Changing configuration persistence shape unless required for UI state.
- Redesigning notebook settings.

## Approach Options
1. Keep a single scrolling page and only add stronger section dividers.
- Pros: smallest implementation change.
- Cons: does not solve the core discoverability problem once more settings are added.

2. Add top horizontal tabs and keep lightweight cards inside each tab.
- Pros: common mental model, works well in a modal, reduces scan length, easy to extend.
- Cons: requires local UI state and moderate CSS refactor.

3. Add left-side navigation with right-side content.
- Pros: scales best for very large settings surfaces.
- Cons: too heavy for the current modal size and existing compact UI.

## Recommendation
Choose option 2. Use top horizontal tabs for first-level grouping, then use simple cards and field groups inside each tab. This matches the scale of the current modal while preventing the layout from becoming an endlessly appended form.

## Information Architecture
- `Models`
- Main window concurrent model count.
- Default main model slots.
- Sub-thread model.
- `Providers`
- Built-in provider API keys.
- Custom provider cards with base URL, API key, and model list.
- `Advanced`
- Sub-session context mode.
- Reserved space for future lower-frequency or expert settings.

## Interaction Design
- The modal header remains fixed at the top of the panel.
- A horizontal tab bar sits directly under the header.
- Only one tab body is visible at a time; the content area scrolls independently.
- The initial tab is `Models`, since it contains the most frequently adjusted runtime choices.
- Switching tabs preserves unsaved input because config writes already happen on change.
- Existing provider API key visibility toggles remain per provider.
- Existing custom model drag-and-drop behavior remains unchanged inside `Providers`.

## Visual Design
- Reuse the current modal shell and introduce a segmented-style tab row under the header.
- Use a slightly tinted background for the tab strip so it reads as navigation rather than content.
- Keep tab labels short and plain: `Models`, `Providers`, `Advanced`.
- Use cards or grouped blocks inside each tab to avoid large undifferentiated text fields.
- Preserve the existing visual language: white surface, subtle borders, blue accent, compact spacing.

## Data Flow
- Configuration values continue to come from Redux `configSlice`.
- The selected settings tab is local component UI state only and is not persisted.
- Existing Redux actions and persistence stay unchanged.
- Tab switching only changes rendering branches; no storage migration is needed.

## Testing Strategy
- Add component tests for:
- Default tab selection on open.
- Switching between tabs.
- Confirming model controls only appear in `Models`.
- Confirming provider controls only appear in `Providers`.
- Confirming advanced controls only appear in `Advanced`.
- Keep existing behavior coverage for Redux-backed control changes intact through interaction tests.

## Risks And Mitigations
- Risk: moving fields between tabs may make some settings feel hidden.
- Mitigation: keep tab names obvious and place the most-used settings in `Models`.
- Risk: the `Providers` tab can still become long with many custom providers.
- Mitigation: isolate that length to one task-focused tab instead of the whole settings surface.
- Risk: CSS changes may affect the existing note settings panel styles.
- Mitigation: scope new tab styles to the AI settings modal classes and avoid changing shared note settings selectors.
