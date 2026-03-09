# Sidebar Text Clipping Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix sidebar chat/note result text clipping in some browsers while preserving the current single-line ellipsis layout.

**Architecture:** Keep the existing search and result derivation logic intact. Adjust the sidebar row markup in `src/App.tsx` to wrap result text in a dedicated truncation container, then harden the CSS in `src/index.css` so the wrapper and highlight spans shrink and paint correctly across browsers.

**Tech Stack:** React, TypeScript, CSS, Vitest

---

### Task 1: Write a failing regression test for sidebar result structure

**Files:**
- Modify: `src/App.test.tsx` or create a focused sidebar rendering test if no App test exists.

**Step 1: Write the failing test**
- Render the sidebar with one chat result and one note result.
- Assert each rendered result row contains a dedicated text wrapper class.
- Assert highlighted segments are nested inside that wrapper when a search term is active.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because the wrapper does not exist yet.

### Task 2: Implement the minimal markup fix

**Files:**
- Modify: `src/App.tsx`

**Step 1: Wrap sidebar result text in a dedicated label container**
- Apply the new wrapper in both the AI list and Notebook list rendering paths.

**Step 2: Keep existing behavior intact**
- Preserve keys, click handlers, context menus, active state, and tooltips.

### Task 3: Implement the browser-safe truncation styles

**Files:**
- Modify: `src/index.css`

**Step 1: Move single-line truncation to the inner label wrapper**
- Add `display`, `min-width`, `overflow`, and `text-overflow` constraints to the wrapper.

**Step 2: Normalize highlight segment layout**
- Ensure highlighted spans stay inline and do not introduce width/paint issues.

### Task 4: Verify the fix

**Step 1: Re-run the targeted regression test**

Run: `npm test -- src/App.test.tsx`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
