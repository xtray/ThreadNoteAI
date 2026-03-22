# MiniMax M2.7 Built-in Series Design

**User Intent:** Replace built-in MiniMax M2.5 model series with MiniMax M2.7 series and keep built-in model usage working in settings, defaults, and config transfer flows.

## Scope
- In scope:
- Update built-in MiniMax model IDs and display names from `MiniMax-M2.5*` to `MiniMax-M2.7*`.
- Update default built-in model ID to `MiniMax-M2.7`.
- Update tests that intentionally assert built-in default/fallback model IDs.
- Keep provider routing and API request flow unchanged.
- Out of scope:
- Changing provider base URL or auth behavior.
- Adding/removing non-MiniMax providers or models.
- Migrating historical user storage values beyond existing fallback behavior.

## Approach Options
1. Replace old built-in MiniMax entries with M2.7 only.
- Pros: clear upgrade path, no ambiguous duplicate entries, aligns with "upgraded series" request.
- Cons: stored `MiniMax-M2.5*` values become invalid and rely on existing fallback logic.

2. Keep M2.5 and add M2.7 side-by-side.
- Pros: backward-compatible with old stored values.
- Cons: leaves stale models in UI and weakens "series upgrade" intent.

3. Keep built-in unchanged and require users to add custom provider model names.
- Pros: minimal code edits.
- Cons: does not satisfy built-in upgrade requirement.

## Recommendation
Choose option 1: replace built-in MiniMax M2.5 series with MiniMax M2.7 series, and update defaults plus tests. Existing config sanitization already falls back to valid model IDs, so invalid historical IDs degrade safely.

## Data/Behavior Notes
- `DEFAULT_MODEL_ID` should become `MiniMax-M2.7`.
- Built-in model list should expose `MiniMax-M2.7` and `MiniMax-M2.7-highspeed`.
- Import/sanitize tests must expect `MiniMax-M2.7` as fallback default.

## Testing Strategy
- Update failing tests first for new model IDs.
- Run focused tests:
- `src/utils/aiConfigTransfer.test.ts`
- `src/components/Settings/SettingsPanel.test.tsx`
- Run full verification:
- `npm test`
- `npm run build`
