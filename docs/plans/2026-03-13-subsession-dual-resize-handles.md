# Sub-session Dual Resize Handles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a bottom-left resize handle to the sub-session overlay while keeping the existing corner resize behavior intact.

**Architecture:** Keep resize state local to `FloatingOverlay.tsx`, add a resize-direction discriminator for the active drag corner, and render two handle elements that share a base CSS class with corner-specific modifiers. Use a focused render test to lock in both handles in non-fullscreen mode.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Lock in dual-handle rendering

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.test.tsx`
- Test: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**

Update the existing resize-handle render test so it asserts both the top-left and bottom-left handle class names are present.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: FAIL because the bottom-left handle does not exist yet.

**Step 3: Write minimal implementation**

Adjust the test assertions only; do not change production code yet.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: PASS after production code is updated in Task 2.

**Step 5: Commit**

```bash
git add src/components/Chat/FloatingOverlay.test.tsx
git commit -m "test: cover sub-session dual resize handles"
```

### Task 2: Add the mirrored bottom-left handle

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.tsx`
- Modify: `src/index.css`
- Test: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**

Reuse Task 1's updated render test as the regression guard.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: FAIL because only one resize handle is rendered.

**Step 3: Write minimal implementation**

Render a second bottom-left handle, add corner-specific CSS modifiers, and update the resize drag math so height changes according to the active corner while width behavior remains shared.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Chat/FloatingOverlay.tsx src/index.css src/components/Chat/FloatingOverlay.test.tsx
git commit -m "feat: add bottom-left sub-session resize handle"
```
