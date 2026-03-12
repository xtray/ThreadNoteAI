# Selection Floating Lightweight Visual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the selection floating pill feel lighter by reducing its shadow and roundness.

**Architecture:** Keep the existing selection floating action layout and behavior unchanged. Apply a CSS-only tuning pass to the pill and button surfaces in `src/index.css`.

**Tech Stack:** CSS, Vitest, Vite

---

### Task 1: Apply the minimal visual tuning

**Files:**
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

- Reduce the floating pill shadow values.
- Reduce the pill border radius slightly.
- Reduce the inner button radius slightly, keeping hover and copied states intact.

**Step 2: Run targeted verification**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: PASS.

### Task 2: Verify at project level

**Files:**
- Verify: `src/index.css`

**Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.
