# Providers Control Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify the visual treatment of built-in provider inputs and custom provider form controls in the `Providers` tab.

**Architecture:** Keep behavior unchanged and implement this as a presentation-only refinement. Add stable provider-specific class hooks in `SettingsPanel.tsx`, then consolidate the related CSS in `src/index.css` so inputs, inline buttons, and card spacing share one design language.

**Tech Stack:** React, TypeScript, React DOM Server, Vitest, CSS

---

### Task 1: Add failing tests for shared provider control classes

**Files:**
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

Add assertions that built-in provider key rows and custom provider form controls render shared provider control classes for inputs and action buttons.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because the shared provider control classes do not exist yet.

### Task 2: Add provider control hook classes

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`

**Step 1: Mark built-in and custom provider inputs with shared provider input classes**

**Step 2: Mark provider action buttons with shared provider button classes**

### Task 3: Unify provider control styling

**Files:**
- Modify: `src/index.css`

**Step 1: Add shared provider input styles**

**Step 2: Add shared provider button styles**

**Step 3: Normalize provider card spacing and hover/focus behavior**

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
