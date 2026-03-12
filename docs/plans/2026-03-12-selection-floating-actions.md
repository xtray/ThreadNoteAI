# Selection Floating Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the assistant text-selection popup with a two-icon floating action pill for sub-session creation and copying the current selected text.

**Architecture:** Keep the existing selection lifecycle in `MessageItem` and extract the new floating action configuration into a small pure helper that can be tested in Node without introducing a browser-only test harness. Reuse `copyTextToClipboard` for the copy action and update the popup markup/CSS to render icon-only controls.

**Tech Stack:** React, TypeScript, Vitest, lucide-react

---

### Task 1: Lock down the floating action contract with failing tests

**Files:**
- Create: `src/components/Chat/selectionFloatingActions.test.tsx`
- Create: `src/components/Chat/selectionFloatingActions.tsx`

**Step 1: Write the failing test**

- Add a test that renders the assistant selection floating actions to static markup.
- Assert the markup includes exactly two buttons, the first button has title `Create sub-session dialog`, and the second button has title `Copy selected text`.
- Assert the action ids are stable so `MessageItem` can wire the handlers deterministically.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: FAIL because the helper and markup do not exist yet.

### Task 2: Implement the icon-only floating action helper

**Files:**
- Create: `src/components/Chat/selectionFloatingActions.tsx`

**Step 1: Write minimal implementation**

- Export a helper that returns two icon-only action descriptors with ids, titles, and icons for sub-session creation and copy.
- Export a tiny render helper/component that maps the descriptors to pill buttons with accessible labels and tooltips.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: PASS.

### Task 3: Wire `MessageItem` to the new floating action menu

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing integration expectation**

- Extend `src/components/Chat/MessageItem.test.tsx` so assistant markup no longer expects the old text popup contract and instead expects the floating action container class to be available when rendered.

**Step 2: Write minimal implementation**

- Replace the single floating selection button with the two-action pill UI.
- Keep the existing create-sub-session handler intact.
- Add a new handler that copies `selectedText.trim()` via `copyTextToClipboard`.
- Update CSS for the pill container and icon buttons while preserving current positioning and pointer guards.

**Step 3: Run targeted tests**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx src/components/Chat/MessageItem.test.tsx`

Expected: PASS.

### Task 4: Verify the feature end to end at project level

**Files:**
- Verify: `src/components/Chat/selectionFloatingActions.tsx`
- Verify: `src/components/Chat/selectionFloatingActions.test.tsx`
- Verify: `src/components/Chat/MessageItem.tsx`
- Verify: `src/components/Chat/MessageItem.test.tsx`
- Verify: `src/index.css`

**Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.
