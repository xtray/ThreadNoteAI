# Selection Tooltip Surface Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the chat selection tooltip so it uses a cleaner, theme-aware surface and no longer shows the diamond connector.

**Architecture:** Keep the existing shared tooltip markup in `src/components/Chat/selectionFloatingActions.tsx` and update only the tooltip CSS in `src/index.css`. Preserve behavior, spacing logic, and action ordering while tuning the visual language.

**Tech Stack:** CSS, React, Vitest, Vite

---

### Task 1: Write the failing tooltip regression

**Files:**
- Modify: `src/components/Chat/selectionFloatingActions.test.tsx`

**Step 1: Write the failing test**

- Add an assertion that the rendered tooltip markup does not rely on the old connector treatment.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: FAIL because the current tooltip styling still includes the old connector rule assumptions.

### Task 2: Apply the minimal visual refresh

**Files:**
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

- Replace the tooltip background with a softer theme-aware surface.
- Add a subtle border and lighter shadow.
- Remove the diamond connector styling.
- Keep hover/focus reveal behavior intact.

**Step 2: Run targeted verification**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: PASS.

### Task 3: Verify project integration

**Files:**
- Verify: `src/index.css`
- Verify: `src/components/Chat/selectionFloatingActions.test.tsx`

**Step 1: Run focused regression checks**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx src/components/Chat/subSessionSelection.test.ts`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.
