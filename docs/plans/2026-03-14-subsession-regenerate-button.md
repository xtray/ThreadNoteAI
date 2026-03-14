# Sub-session Regenerate Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the main-window `Regenerate` assistant-turn action to every assistant reply inside the sub-session overlay.

**Architecture:** Keep the overlay UI thin. `FloatingOverlay` will render the same two-action turn toolbar shape as the main chat window and dispatch the existing `regenerateMessage` session action, so replay logic remains centralized in Redux state and saga handling.

**Tech Stack:** React, Redux Toolkit, TypeScript, Vitest

---

### Task 1: Write failing overlay toolbar tests

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**
- Add a test that assistant replies render both `Copy` and `Regenerate` in the sub-session toolbar.
- Add a test that user-only replies do not render `Regenerate`.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: FAIL because the overlay currently only renders `Copy`.

### Task 2: Implement overlay regenerate action

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.tsx`

**Step 1: Add the toolbar action**
- Import the regenerate action creator and icon used by the main window.
- Add a `handleRegenerate` callback that dispatches `regenerateMessage({ sessionId, messageId })`.
- Render `Regenerate` beside `Copy` for assistant replies and disable it while the session is loading.

**Step 2: Keep parity with the main window**
- Preserve the existing `Copy` behavior and ordering.
- Do not add overlay-specific replay logic.

### Task 3: Verification

**Step 1: Re-run targeted tests**
Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: PASS

**Step 2: Full test suite**
Run: `npm test`
Expected: PASS

**Step 3: Build verification**
Run: `npm run build`
Expected: PASS
