# Chat Settings Tabs Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the AI chat settings tabs with provider search and collapsible provider cards, plus clearer guidance in the Models and Advanced tabs.

**Architecture:** Keep all persisted config in Redux unchanged and add only local UI state inside `SettingsPanel.tsx` for provider query and collapse state. Extend the existing tabbed layout with small helper cards and searchable provider sections, then verify the behavior with focused server-rendered component tests.

**Tech Stack:** React, TypeScript, Redux Toolkit, React DOM Server, Vitest, CSS

---

### Task 1: Add failing tests for settings tab polish

**Files:**
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:
- `Models` tab includes new explanatory copy.
- `Providers` tab can render a filtered subset when given a provider query.
- custom provider cards can render collapsed summaries.
- `Advanced` tab includes explanation text for context mode choices.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because the new copy, search support, and collapsed rendering do not exist yet.

### Task 2: Implement provider search and collapsible cards

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`

**Step 1: Add local UI state**

Track provider search text and collapsed state by provider id.

**Step 2: Add provider filtering helpers**

Match built-in providers by name and custom providers by name or model name, case-insensitively.

**Step 3: Add collapsible custom provider headers**

Show provider name, model count summary, and expand/collapse affordance in the card header. Keep matched providers expanded during active search.

**Step 4: Add explanatory content for Models and Advanced**

Add concise guidance cards and helper text without changing configuration behavior.

### Task 3: Add scoped styling for the polished layout

**Files:**
- Modify: `src/index.css`

**Step 1: Add info card styles**

Style the helper cards in `Models` and `Advanced`.

**Step 2: Add provider search and collapsible card styles**

Style the search input row, summary text, chevron button, and collapsed card states.

### Task 4: Verify the redesign

**Step 1: Re-run targeted settings tests**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: PASS

**Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run the production build**

Run: `npm run build`
Expected: PASS
