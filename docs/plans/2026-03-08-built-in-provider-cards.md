# Built-In Provider Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle built-in provider API key rows as lightweight cards so the `Providers` tab has a more uniform card-based layout.

**Architecture:** Leave all state and actions unchanged. Update `SettingsPanel.tsx` to wrap built-in provider key controls in lightweight provider cards, then refine the related CSS in `src/index.css` so built-in and custom provider sections share one visual rhythm.

**Tech Stack:** React, TypeScript, React DOM Server, Vitest, CSS

---

### Task 1: Add failing test coverage

**Files:**
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

Assert that built-in providers render a lightweight provider card wrapper class in the `Providers` tab output.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because built-in provider rows do not use the card wrapper yet.

### Task 2: Implement built-in provider cards

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`

**Step 1: Wrap each built-in provider in a lightweight provider card shell**

**Step 2: Keep existing provider input and visibility toggle behavior unchanged**

### Task 3: Refine styling

**Files:**
- Modify: `src/index.css`

**Step 1: Add shared lightweight card styles for built-in providers**

**Step 2: Tighten spacing so built-in cards align visually with custom provider cards**

### Task 4: Verify

**Step 1: Run targeted settings tests**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
