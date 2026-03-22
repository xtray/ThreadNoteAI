# UI Language Restore Design

**User Intent:** Reintroduce English/Chinese UI language switching on the current branch, using `/Users/xtray/dev/project/ThreadNoteAI_CHG` only as a reference, while preserving all current branch behavior and avoiding any backup-branch regressions.

## Goals

- Add a persistent `Language` selector to `Settings > General`.
- Support exactly two UI languages: English (`en`) and Chinese (`zh`).
- Default to English when no saved language exists.
- Switch visible UI copy immediately when the language changes.
- Translate all visible UI text on the current branch, including:
  - settings and app shell
  - chat and sub-thread controls
  - tooltips and hover titles
  - `aria-label` and other accessibility text
  - left-click menus and context menus
  - delete confirmations
  - input placeholders and empty states

## Non-Goals

- Porting files wholesale from the backup branch.
- Importing any known backup bugs or non-language behavior changes.
- Translating user-generated content, model names, provider names, or exported data schemas.

## Constraints

- The current branch is the source of truth for behavior.
- The backup branch is reference-only for text coverage, types, and test ideas.
- Existing features must remain intact.

## Options Considered

### 1. Recommended: rebuild language support directly on current branch using backup as reference

Pros:
- Preserves current branch functionality.
- Avoids importing backup regressions.
- Lets the translation layer fit the current UI surface exactly.

Cons:
- More manual integration work than copying.

### 2. Partially port files from backup

Pros:
- Faster mechanically.

Cons:
- High regression risk because current branch behavior has diverged.

### 3. Full file replacement from backup

Pros:
- Fastest in the short term.

Cons:
- Unacceptable risk of restoring backup bugs and dropping current fixes.

## Chosen Design

Use option 1.

## Architecture

- Add a small `src/i18n/text.ts` module on the current branch with:
  - `AppLanguage = 'en' | 'zh'`
  - default language constant
  - sanitization helper
  - one shared dictionary for all current-branch UI text
- Extend `src/store/slices/configSlice.ts` with persisted `language`.
- Update the General settings tab to render and persist the language selector.
- Replace current hard-coded UI strings with translated lookups component-by-component, keeping behavior unchanged.

## Restore Strategy

1. Restore the shared i18n foundation and persisted language state.
2. Cover settings, app shell, notebook, and chat surfaces already visible on the current branch.
3. Sweep the current branch for any remaining hard-coded visible UI strings and translate them.
4. Verify with tests, build, and full suite after implementation.

## Risk Management

- Use test-first changes for config persistence and representative translated UI surfaces.
- Avoid bulk file replacement.
- Limit edits to UI copy and the minimum state wiring needed for language persistence.
- Reuse current branch tests and add focused coverage where strings are easy to regress.

## Testing

- Reducer tests for `language` defaulting, sanitization, and persistence.
- Settings rendering tests for the new General language field.
- App shell and chat rendering tests for English/Chinese output.
- Regression checks for menus, confirmations, placeholders, and tooltips on current-branch surfaces.
- `npm run build`
- `npm test`
