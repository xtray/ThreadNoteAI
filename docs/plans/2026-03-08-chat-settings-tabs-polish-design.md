# Chat Settings Tabs Polish Design

**User Intent:** Continue improving the left AI chat settings panel after the tab redesign so it feels easier to operate at scale, especially when provider count grows and when advanced options need more explanation.

## Scope
- In scope:
- Add lightweight search inside the `Providers` tab.
- Add per-provider expand/collapse to reduce visual noise.
- Add clearer descriptive copy and recommendation hints in the `Models` tab.
- Refine the `Advanced` tab into an explanation-first layout with grouped content.
- Out of scope:
- Persisting UI-only search or collapse state.
- New backend configuration fields.
- Reworking notebook settings.

## Approach Options
1. Add only more helper copy, no new interactions.
- Pros: minimal code.
- Cons: does not solve long provider lists.

2. Add provider search plus collapsible cards, and enhance copy in other tabs.
- Pros: best balance of usability and implementation size.
- Cons: adds a few local UI states.

3. Split providers into nested subtabs.
- Pros: cleaner for large future growth.
- Cons: more navigation depth inside an already tabbed modal.

## Recommendation
Choose option 2. Keep the single `Providers` tab, but make it easier to scan with search and collapsible cards. Improve `Models` and `Advanced` with short, task-focused guidance rather than adding another navigation layer.

## Information Architecture
- `Models`
- Introductory helper card describing what affects main chat vs sub-thread behavior.
- Recommended guidance near concurrent model count and main model slots.
- `Providers`
- Search field that filters built-in providers and custom providers by provider or model name.
- Built-in keys remain always visible inside one grouped card.
- Custom provider cards become collapsible; collapsed cards still show name and summary.
- `Advanced`
- Small intro copy explaining this area is lower-frequency behavior tuning.
- One grouped card for sub-session context mode with short option guidance.

## Interaction Design
- Provider search filters as the user types, case-insensitively.
- Search matches:
- built-in provider names,
- custom provider names,
- custom provider model names.
- Custom providers are expanded by default when there is only one or when a search match is active.
- Users can manually collapse or expand each custom provider card.
- Search does not mutate saved config and resets when the modal closes.

## Visual Design
- Reuse the current settings tab visual language.
- Add a soft info card style for explanatory copy in `Models` and `Advanced`.
- Add a compact provider search input at the top of the `Providers` tab.
- Make custom provider card headers clickable with a chevron and secondary summary text.
- Keep dense form controls unchanged inside expanded cards.

## Testing Strategy
- Add tests for provider search matching provider and model names.
- Add tests for provider summary/collapse rendering behavior.
- Add tests that `Models` and `Advanced` expose the new explanatory copy.

## Risks And Mitigations
- Risk: local collapse state may feel inconsistent during search.
- Mitigation: force matched providers open while a search query is active.
- Risk: more helper copy can make the panel feel verbose.
- Mitigation: keep copy to one or two short sentences per section.
