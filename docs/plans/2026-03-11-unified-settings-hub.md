# Unified Settings Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified settings hub with primary `General` / `AI` / `Notebook` navigation, migrate notebook settings into it, and add import/export tools for AI configuration and AI chat data.

**Architecture:** Keep one modal shell and refactor it into a primary-domain settings container. Reuse the existing AI settings sections under an AI secondary tab bar, extract notebook settings out of `App.tsx`, and isolate import/export logic in testable utilities so Redux state and IndexedDB replacement remain predictable.

**Tech Stack:** React 18, TypeScript, Redux Toolkit, redux-saga persistence, Vitest, IndexedDB helper utilities

---

### Task 1: Add config support for General theme selection

**Files:**
- Modify: `src/store/slices/configSlice.ts`
- Test: `src/store/slices/configSlice.test.ts`

**Step 1: Write the failing test**

```ts
it('persists themeEffect and excludes settingsOpen from exported config state', async () => {
  // import reducer/actions/helpers once added
  // assert default themeEffect
  // dispatch theme change
  // verify persisted JSON contains themeEffect
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/slices/configSlice.test.ts`
Expected: FAIL because `themeEffect` state and actions do not exist yet.

**Step 3: Write minimal implementation**

```ts
export interface ConfigState {
  themeEffect: 'light' | 'dark' | 'system';
  // existing fields...
}

setThemeEffect: (state, action: PayloadAction<ConfigState['themeEffect']>) => {
  state.themeEffect = action.payload;
  persistConfig(state);
}
```

Also update load/normalize logic so invalid stored values fall back to the default.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/store/slices/configSlice.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices/configSlice.ts src/store/slices/configSlice.test.ts
git commit -m "feat: persist general theme setting"
```

### Task 2: Add AI config export/import utilities

**Files:**
- Create: `src/utils/aiConfigTransfer.ts`
- Test: `src/utils/aiConfigTransfer.test.ts`
- Modify: `src/store/slices/configSlice.ts`

**Step 1: Write the failing test**

```ts
it('exports only stable AI config fields', () => {
  expect(exportAiConfig(config)).toEqual({
    format: 'threadnote-ai-config-export',
    version: 1,
    // no settingsOpen
  });
});

it('imports AI config with sanitization', () => {
  expect(importAiConfigPayload(badPayload)).toMatchObject({
    customProviders: [],
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/aiConfigTransfer.test.ts`
Expected: FAIL because the utility module does not exist.

**Step 3: Write minimal implementation**

```ts
export const exportAiConfig = (config: ConfigState) => ({ ...stableFields });
export const importAiConfigPayload = (payload: unknown, fallback: ConfigState) => normalizedConfig;
```

Add a reducer such as `replaceAiConfig` that applies imported config through existing normalization helpers.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/aiConfigTransfer.test.ts src/store/slices/configSlice.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/aiConfigTransfer.ts src/utils/aiConfigTransfer.test.ts src/store/slices/configSlice.ts src/store/slices/configSlice.test.ts
git commit -m "feat: add ai config import export helpers"
```

### Task 3: Add AI chats export/import utilities with overwrite and merge modes

**Files:**
- Create: `src/utils/aiChatsTransfer.ts`
- Test: `src/utils/aiChatsTransfer.test.ts`
- Modify: `src/utils/db.ts`

**Step 1: Write the failing test**

```ts
it('exports chats with metadata and session payload', () => {
  expect(exportAiChats(state)).toMatchObject({
    format: 'threadnote-ai-chats-export',
    version: 1,
  });
});

it('merges imported chats by session id', () => {
  expect(mergeImportedChats(current, incoming).sessions).toHaveProperty('existing');
});

it('overwrites chats and resolves active session safely', () => {
  expect(overwriteImportedChats(current, incoming).activeSessionId).toBe('root-1');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/aiChatsTransfer.test.ts`
Expected: FAIL because the transfer utility does not exist.

**Step 3: Write minimal implementation**

```ts
export const exportAiChats = ({ sessions, activeSessionId }: SessionState) => ({ ...payload });
export const mergeImportedChats = (...) => ({ sessions, activeSessionId });
export const overwriteImportedChats = (...) => ({ sessions, activeSessionId });
```

Keep DB helpers unchanged unless a focused helper for replace-all sessions is needed for UI wiring.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/aiChatsTransfer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/aiChatsTransfer.ts src/utils/aiChatsTransfer.test.ts src/utils/db.ts
git commit -m "feat: add ai chats import export helpers"
```

### Task 4: Refactor the settings shell into primary General / AI / Notebook navigation

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Test: `src/components/Settings/SettingsPanel.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Write the failing test**

```tsx
it('renders primary settings navigation with General, AI, and Notebook', () => {
  expect(html).toContain('General');
  expect(html).toContain('Notebook');
});

it('shows General by default when opened from the title icon', () => {
  expect(html).toContain('Theme Effect');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because the primary navigation and general page do not exist.

**Step 3: Write minimal implementation**

```tsx
type SettingsPrimaryTabId = 'general' | 'ai' | 'notebook';
type SettingsTabId = 'models' | 'providers' | 'advanced' | 'data';
```

Add the left rail, keep AI content in the secondary tab plane, and add a title-row icon button in `App.tsx` that opens settings to `general`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/SettingsPanel.tsx src/components/Settings/SettingsPanel.test.tsx src/App.tsx src/App.css
git commit -m "feat: add unified settings shell"
```

### Task 5: Migrate notebook settings content into the unified Notebook page

**Files:**
- Create: `src/components/Settings/NotebookSettingsSection.tsx`
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/Settings/SettingsPanel.test.tsx`
- Test: `src/App.test.tsx`

**Step 1: Write the failing test**

```tsx
it('renders notebook import and export actions in the Notebook page', () => {
  expect(html).toContain('Export Notes');
  expect(html).toContain('Import Notes');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: FAIL because notebook settings still live in `App.tsx`.

**Step 3: Write minimal implementation**

```tsx
export function NotebookSettingsSection(props: NotebookSettingsProps) {
  return <section>{/* moved notebook settings UI */}</section>;
}
```

Remove the standalone notebook settings modal and make the existing notebook bottom button open unified settings preselected to `Notebook`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/NotebookSettingsSection.tsx src/components/Settings/SettingsPanel.tsx src/App.tsx src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx
git commit -m "feat: move notebook settings into unified panel"
```

### Task 6: Wire AI Data tab import/export controls to Redux and IndexedDB flows

**Files:**
- Create: `src/components/Settings/AiDataSettingsSection.tsx`
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/store/slices/sessionSlice.ts`
- Test: `src/components/Settings/SettingsPanel.test.tsx`
- Test: `src/store/slices/sessionSlice.test.ts`

**Step 1: Write the failing test**

```tsx
it('renders AI data actions for config and chats', () => {
  expect(html).toContain('Export AI Model Configuration');
  expect(html).toContain('Overwrite current chats');
});
```

If reducer support is needed:

```ts
it('loads imported sessions and preserves active session on merge when valid', () => {
  expect(next.activeSessionId).toBe('current');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/store/slices/sessionSlice.test.ts`
Expected: FAIL because the data actions and import reducers do not exist.

**Step 3: Write minimal implementation**

```tsx
<button onClick={handleExportAiConfig}>Export AI Model Configuration</button>
<button onClick={handleImportAiChatsOverwrite}>Overwrite current chats</button>
<button onClick={handleImportAiChatsMerge}>Merge into current chats</button>
```

Add the thinnest reducer or dispatch path needed to load imported chats and replace IndexedDB using existing bulk persistence helpers.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/store/slices/sessionSlice.test.ts src/utils/aiConfigTransfer.test.ts src/utils/aiChatsTransfer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/AiDataSettingsSection.tsx src/components/Settings/SettingsPanel.tsx src/App.tsx src/store/slices/sessionSlice.ts src/components/Settings/SettingsPanel.test.tsx src/store/slices/sessionSlice.test.ts
git commit -m "feat: wire ai data import export controls"
```

### Task 7: Run full verification

**Files:**
- Modify: none

**Step 1: Run targeted tests**

Run: `npm test -- src/store/slices/configSlice.test.ts src/utils/aiConfigTransfer.test.ts src/utils/aiChatsTransfer.test.ts src/components/Settings/SettingsPanel.test.tsx src/store/slices/sessionSlice.test.ts src/App.test.tsx`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run production build**

Run: `npm run build`
Expected: PASS

**Step 4: Review git diff**

Run: `git status --short`
Expected: only intended files changed

**Step 5: Commit**

```bash
git add src/components/Settings src/store/slices src/utils src/App.tsx src/App.css
git commit -m "feat: unify general ai and notebook settings"
```

### Parallel Work Split

Use `@dispatching-parallel-agents` with isolated worktrees and branches after the shell task lands:

1. Worker A: Config/data transfer utilities
- Owns `src/store/slices/configSlice.ts`, `src/store/slices/configSlice.test.ts`, `src/utils/aiConfigTransfer.ts`, `src/utils/aiConfigTransfer.test.ts`, `src/utils/aiChatsTransfer.ts`, `src/utils/aiChatsTransfer.test.ts`

2. Worker B: Unified settings shell and General/AI navigation
- Owns `src/components/Settings/SettingsPanel.tsx`, `src/components/Settings/SettingsPanel.test.tsx`, `src/App.tsx`, `src/App.css`

3. Worker C: Notebook settings migration and AI data action sections
- Owns `src/components/Settings/NotebookSettingsSection.tsx`, `src/components/Settings/AiDataSettingsSection.tsx`, `src/App.tsx` only after rebasing on Worker B, plus any narrowly required tests

Sequence note: Worker C depends on the shell layout from Worker B, so run A and B in parallel first, then rebase C on B before integration.
