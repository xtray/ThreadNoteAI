# Sub-session Resize Handle Visual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the visible resize triangle from the sub-session overlay while preserving the top-left resize hotspot and cursor.

**Architecture:** Keep the existing resize handle element and mouse-drag logic in the overlay component. Limit the behavior change to CSS by deleting the pseudo-element that draws the triangle, and lock in the handle’s presence with a focused render test.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Lock in the resize handle render

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.test.tsx`
- Test: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**

Add a test that renders a sub-session overlay and asserts the markup contains `overlay-resize-handle`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: FAIL because the assertion does not exist yet.

**Step 3: Write minimal implementation**

Add the new expectation without changing production code.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: PASS with the new resize-handle assertion green.

**Step 5: Commit**

```bash
git add src/components/Chat/FloatingOverlay.test.tsx
git commit -m "test: cover sub-session resize handle render"
```

### Task 2: Remove the visible triangle without changing interaction

**Files:**
- Modify: `src/index.css`
- Verify: `src/components/Chat/FloatingOverlay.tsx`
- Test: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**

Reuse the resize-handle render test from Task 1 as the guardrail that ensures the hotspot still exists after the style change.

**Step 2: Run test to verify it fails**

No additional failure is required here because the behavior change is CSS-only; use the passing render test as the regression guard.

**Step 3: Write minimal implementation**

Delete the `.overlay-resize-handle::after` and `.overlay-resize-handle:hover::after` rules so the triangle is never drawn, while preserving `.overlay-resize-handle` positioning, size, and cursor.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/index.css src/components/Chat/FloatingOverlay.test.tsx
git commit -m "style: hide sub-session resize triangle"
```
