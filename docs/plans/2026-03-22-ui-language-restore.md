# UI Language Restore Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild persistent English/Chinese UI language switching on the current branch without importing any backup-branch behavior regressions.

**Architecture:** Add a lightweight translation dictionary and persisted `config.language` field on the current branch, then replace current visible UI strings with translated lookups while preserving the branch’s existing behavior and interaction flow.

**Tech Stack:** React 18, TypeScript, Redux Toolkit, Vitest

---

### Task 1: Add failing tests for persisted language state

**Files:**
- Modify: `src/store/slices/configSlice.test.ts`
- Modify: `src/store/slices/configSlice.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- `language` defaults to `en`
- `setLanguage('zh')` persists the value
- invalid stored values sanitize back to `en`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/slices/configSlice.test.ts`
Expected: FAIL because the current branch has no `language` config field.

**Step 3: Write minimal implementation**

Add the `language` field, sanitizer, reducer, storage load/save logic.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/store/slices/configSlice.test.ts`
Expected: PASS.

### Task 2: Add failing tests for translated settings and app shell

**Files:**
- Modify: `src/components/Settings/SettingsPanel.test.tsx`
- Modify: `src/App.test.tsx`

**Step 1: Write the failing tests**

Assert that:
- General settings renders a `Language` field in English
- Chinese preloaded state renders translated settings/app shell copy

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: FAIL because strings are still hard-coded English.

**Step 3: Write minimal implementation**

Add the dictionary and wire settings/app shell to use it.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: PASS.

### Task 3: Restore the i18n layer and General settings selector

**Files:**
- Create: `src/i18n/text.ts`
- Modify: `src/store/slices/configSlice.ts`
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/components/Settings/NotebookSettingsSection.tsx`
- Modify: `src/components/Settings/AiDataSettingsSection.tsx`
- Modify: `src/components/Settings/SidebarTitleBar.tsx`

**Step 1: Add dictionary/types**

Create the shared translation module based on current-branch UI needs, using the backup only as reference.

**Step 2: Restore language selector**

Render and persist the new `Language` field in `Settings > General`.

**Step 3: Translate settings shell**

Translate settings tabs, labels, settings descriptions, and related actions.

**Step 4: Verify**

Run: `npm test -- src/store/slices/configSlice.test.ts src/components/Settings/SettingsPanel.test.tsx src/App.test.tsx`
Expected: PASS.

### Task 4: Translate current-branch chat and notebook surfaces

**Files:**
- Modify: `src/components/Notebook/NotebookViewer.tsx`
- Modify: `src/components/Chat/ChatContainer.tsx`
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/components/Chat/MessageContent.tsx`
- Modify: `src/components/Chat/FloatingOverlay.tsx`
- Modify: `src/components/Chat/selectionFloatingActions.tsx`
- Modify: matching tests under `src/components/Chat/*.test.ts*`

**Step 1: Add failing tests**

Add or update focused tests for representative translated chat UI:
- toolbar labels
- copy controls
- menu labels
- placeholders
- confirmations

**Step 2: Verify RED**

Run the targeted chat tests and confirm they fail for missing translations.

**Step 3: Implement minimal translation changes**

Translate visible labels, `title`, `aria-label`, menu items, confirmations, and placeholders.

**Step 4: Verify GREEN**

Run the targeted chat tests again and confirm they pass.

### Task 5: Sweep remaining hard-coded visible UI strings

**Files:**
- Modify current-branch files as needed

**Step 1: Search current UI strings**

Use `rg` to find remaining visible hard-coded text in `src/components`, `src/App.tsx`, and related UI modules.

**Step 2: Translate any remaining visible text**

Limit changes to copy only; do not alter behavior.

**Step 3: Verify with targeted tests where practical**

Run any affected tests.

### Task 6: Build and full verification

**Files:**
- Verify only

**Step 1: Build**

Run: `npm run build`
Expected: PASS.

**Step 2: Full tests**

Run: `npm test`
Expected: PASS.
