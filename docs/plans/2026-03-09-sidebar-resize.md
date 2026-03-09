# Sidebar Resize Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a draggable left sidebar width control that persists the chosen width across refreshes.

**Architecture:** Keep sidebar width state in `App.tsx`, extract persistence and clamping rules into a small helper module, and render a dedicated resize handle between the sidebar and workspace so the layout change stays localized.

**Tech Stack:** React, TypeScript, Vitest, CSS, localStorage

---

### Task 1: Write failing tests for sidebar width helpers

**Files:**
- Create: `src/utils/sidebarWidth.test.ts`
- Create: `src/utils/sidebarWidth.ts`

**Step 1: Write the failing test**
- Add tests for:
- loading the default width when local storage is empty.
- rejecting invalid persisted values.
- clamping widths below the minimum.
- clamping widths above the viewport-based maximum.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/sidebarWidth.test.ts`
Expected: FAIL because the helper module does not exist yet.

### Task 2: Implement sidebar width helpers

**Files:**
- Create: `src/utils/sidebarWidth.ts`

**Step 1: Add width constants and clamp helper**
- Define default and minimum widths plus one function that clamps by viewport width.

**Step 2: Add persisted width loader**
- Read local storage safely.
- Return the default width when the stored value is missing or invalid.

**Step 3: Add persisted width saver**
- Persist only sanitized widths.

### Task 3: Wire the resizable sidebar into the app layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Step 1: Initialize sidebar width from the helper**
- Seed local state once from storage.

**Step 2: Add drag lifecycle**
- Start on primary-button pointer down.
- Update width during window-level move events.
- Persist and stop on pointer up.

**Step 3: Render the resize handle and apply inline width**
- Use the local width state on the sidebar element.
- Insert the resize handle between the sidebar and main content.
- Add hover and active drag styling.

### Task 4: Verify the feature

**Step 1: Re-run targeted helper tests**

Run: `npm test -- src/utils/sidebarWidth.test.ts`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
