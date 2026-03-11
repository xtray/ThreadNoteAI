# Unified Settings Hub Design

**User Intent:** Add a global settings entry beside the left sidebar title, reorganize settings into Global / AI / Notebook domains, keep existing AI settings under the AI domain, migrate notebook settings into the unified surface, and add import/export tools for AI model configuration and AI chat data.

## Scope
- In scope:
- Add a global settings icon beside the `ThreadNote AI` title in the left sidebar.
- Open one unified settings panel from that icon.
- Replace the current flat settings tab layout with left-side primary navigation: `General`, `AI`, `Notebook`.
- Add AI-only secondary tabs: `Models`, `Providers`, `Advanced`, `Data`.
- Move existing notebook settings content into the `Notebook` primary page.
- Add a dummy theme selector under `General`.
- Add AI configuration import/export and AI chats import/export under `AI > Data`.
- Support AI chat import in two explicit modes: overwrite and merge.
- Preserve existing Redux and IndexedDB data flows where practical.
- Out of scope:
- Implementing actual runtime theme switching.
- Adding new notebook features beyond relocating existing notebook settings.
- Changing AI chat generation behavior.
- Adding cloud sync or remote backup.

## Approach Options
1. Keep a single settings panel and extend its top-level tabs only.
- Pros: smallest code change.
- Cons: does not separate global settings from AI and notebook settings clearly.

2. Build one unified settings panel with left-side primary domains and AI-only secondary tabs.
- Pros: matches the requested mental model, scales for future growth, keeps notebook separate from AI.
- Cons: requires moderate component refactoring and some state restructuring.

3. Create separate modals for global, AI, and notebook settings.
- Pros: strong separation by domain.
- Cons: duplicates modal logic, introduces multiple entry points, and weakens discoverability.

## Recommendation
Choose option 2. The first-level split should reflect product domains rather than implementation details. `General`, `AI`, and `Notebook` are understandable top-level destinations, and the AI domain can still keep its existing detailed sub-tabs without mixing notebook controls into the same plane.

## Information Architecture
- Primary navigation:
- `General`
- `AI`
- `Notebook`

- `General`
- Theme effect selector with dummy persistence only.

- `AI`
- Secondary tabs:
- `Models`
- `Providers`
- `Advanced`
- `Data`

- `AI > Models`
- Main window concurrent model count.
- Default main model slots.
- Sub-thread model.

- `AI > Providers`
- Built-in provider API keys.
- Custom provider management.

- `AI > Advanced`
- Sub-session context mode.

- `AI > Data`
- Export AI model configuration.
- Import AI model configuration.
- Export all AI chats.
- Import all AI chats with explicit overwrite or merge actions.

- `Notebook`
- Migrate the existing notebook settings content and behaviors from the current notebook settings modal.

## Interaction Design
- The sidebar title row becomes a compact title + icon action area.
- The new title-row settings icon opens the unified settings panel.
- Existing bottom AI and notebook settings buttons may remain as shortcuts, but should open the same unified panel and preselect `AI` or `Notebook` respectively.
- Primary navigation appears as a vertical tab rail inside the settings panel.
- The `AI` page shows a secondary horizontal tab row above the content area.
- `General` and `Notebook` do not show secondary tabs.
- The default open destination from the title icon is `General`.
- AI chat import UI must make the destructive choice explicit:
- `Overwrite current chats`
- `Merge into current chats`

## Data Design
- Extend persisted config state with a `themeEffect` field.
- Do not persist UI-only state such as whether the settings panel is open or which tab is selected.
- AI config export payload should contain only stable configuration data:
- API keys
- model selections
- sub-session mode
- custom providers
- theme effect only if treated as part of global config export; otherwise keep it in `General` only. For this feature, keep AI config export scoped to AI settings only.
- AI chats export payload should contain:
- format identifier
- version
- exported timestamp
- `activeSessionId`
- full session map

## Import Rules
- AI config import:
- Validate shape and ignore unknown or malformed fields.
- Reuse existing sanitization helpers for custom providers and selected model normalization.

- AI chats overwrite import:
- Replace all current chat sessions in Redux and IndexedDB.
- Replace stored active session if the imported active session exists; otherwise fall back to first root session or null.

- AI chats merge import:
- Merge by `session.id`.
- Imported sessions replace local sessions with the same id.
- Imported-only sessions are added.
- Keep the current active session when it still exists locally after merge; otherwise fall back safely.

## Component Design
- The current `SettingsPanel` should become a unified shell instead of an AI-only shell.
- AI tab content should reuse the existing `SettingsPanelContent` branches with minimal movement.
- Notebook settings content should be extracted from `App.tsx` into a reusable settings section component so notebook behavior is not duplicated.
- Import/export logic should move out of `App.tsx` into focused helpers where possible to keep UI components thin.

## Testing Strategy
- Settings component tests:
- Primary navigation renders `General`, `AI`, and `Notebook`.
- Title-icon open defaults to `General`.
- `AI` renders secondary tabs and keeps existing content separation.
- `Notebook` renders migrated notebook actions.

- Config tests:
- `themeEffect` default and persistence behavior.
- AI config import sanitizes malformed payloads.

- Data import/export tests:
- AI config export excludes UI-only fields.
- AI chats export contains stable metadata and payload shape.
- AI chats overwrite import replaces session state correctly.
- AI chats merge import preserves unrelated sessions and overwrites same-id sessions.

## Risks And Mitigations
- Risk: moving notebook settings out of `App.tsx` can break existing button behavior.
- Mitigation: keep current buttons as shortcuts into the unified settings shell and cover them with component tests.

- Risk: import/export logic mixed with UI can become difficult to test.
- Mitigation: extract serialization and merge helpers into dedicated utility modules with direct unit tests.

- Risk: AI config import may accept invalid model ids after provider changes.
- Mitigation: reuse existing config normalization functions after import before persisting.
