# Ctrl+Wheel Zoom Guard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `Ctrl + mouse wheel` do nothing in the left sidebar and right workspace so the app matches ChatGPT-style zoom behavior.

**Architecture:** Keep the change localized to `App.tsx` by attaching native non-passive wheel listeners to the sidebar and workspace root containers. Use a DOM-based regression test in `src/App.test.tsx` to verify only `Ctrl + wheel` is blocked.

**Tech Stack:** React, TypeScript, Vitest, DOM wheel events

---

### Task 1: Write failing zoom-guard tests

**Files:**
- Modify: `src/App.test.tsx`

**Step 1: Write the failing test**
- Render `App` in a DOM test harness with lightweight mocks for heavy child components and DB helpers.
- Dispatch a cancelable `wheel` event with `ctrlKey: true` on `.sidebar`.
- Dispatch a cancelable `wheel` event with `ctrlKey: true` on `.workspace-main`.
- Assert both events become `defaultPrevented`.
- Dispatch a normal wheel event and assert it is not prevented.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because `App` does not yet install the wheel guard.

### Task 2: Implement the container wheel guard

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add refs for the guarded containers**
- Keep one ref for the sidebar and one ref for the main workspace section.

**Step 2: Install and clean up native wheel listeners**
- Register a shared `wheel` handler with `{ passive: false }`.
- Return early unless `event.ctrlKey` is true.
- Call `preventDefault()` for guarded events.
- Remove listeners in cleanup.

### Task 3: Verify the change

**Step 1: Re-run targeted test**

Run: `npm test -- src/App.test.tsx`
Expected: PASS

**Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run the production build**

Run: `npm run build`
Expected: PASS
