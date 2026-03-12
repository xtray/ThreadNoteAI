# Selection Floating Final Visual Tuning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the selection floating pill border lighter and the hover scale more restrained.

**Architecture:** Keep the current selection floating layout and behavior intact. Apply a CSS-only tuning pass in `src/index.css` for the outer pill border and hover transform.

**Tech Stack:** CSS, Vitest, Vite

---

### Task 1: Apply the minimal visual tuning

**Files:**
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

- Change the pill border to a softer semi-transparent neutral tone.
- Reduce the hover transform scale so the pill grows less on hover.

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
