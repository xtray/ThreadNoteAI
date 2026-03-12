# Selection Floating Layout Tuning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorder the selection floating bubble actions so copy appears first and make the bubble visibly slimmer.

**Architecture:** Keep the current selection floating action helper and update only its action ordering plus the pill/button CSS sizing. Preserve all existing selection-copy and sub-session behavior.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Add a failing test for action order

**Files:**
- Modify: `src/components/Chat/selectionFloatingActions.test.tsx`

**Step 1: Write the failing test**

- Add an assertion that the first action id is `copy-selection` and the second is `create-sub-session`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: FAIL because the helper currently renders sub-session first.

### Task 2: Implement the reordered actions and slimmer layout

**Files:**
- Modify: `src/components/Chat/selectionFloatingActions.tsx`
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

- Swap the action descriptor order.
- Reduce floating pill padding and button dimensions.
- Tighten the active copied-state sizing so it stays visually slim.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: PASS.

### Task 3: Verify at project level

**Files:**
- Verify: `src/components/Chat/selectionFloatingActions.tsx`
- Verify: `src/components/Chat/selectionFloatingActions.test.tsx`
- Verify: `src/index.css`

**Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.
