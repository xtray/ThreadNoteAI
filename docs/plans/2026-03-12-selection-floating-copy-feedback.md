# Selection Floating Copy Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the selection popup copy action switch to a check icon with `Copied` text and dismiss the popup after a short successful-copy delay.

**Architecture:** Keep the transient copied-state timer inside `MessageItem`, where popup visibility already lives. Let `selectionFloatingActions.tsx` render either the default copy action or the temporary copied state based on simple props, while still reusing `copyTextToClipboard`.

**Tech Stack:** React, TypeScript, Vitest, lucide-react

---

### Task 1: Add failing copied-state rendering tests

**Files:**
- Modify: `src/components/Chat/selectionFloatingActions.test.tsx`
- Modify: `src/components/Chat/selectionFloatingActions.tsx`

**Step 1: Write the failing test**

- Add a test that renders the action bar with `copiedSelection` enabled.
- Assert the markup contains `Copied`, renders the copied button state, and no longer renders the default copy tooltip text for that button.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: FAIL because the helper does not yet support the copied visual state.

### Task 2: Implement the copied visual state

**Files:**
- Modify: `src/components/Chat/selectionFloatingActions.tsx`
- Modify: `src/index.css`

**Step 1: Write minimal implementation**

- Add a copied-state variant for the selection copy action using a check icon and `Copied` label.
- Update the floating action button styles so the copied button can expand to fit the temporary label cleanly.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx`

Expected: PASS.

### Task 3: Wire success feedback and delayed dismissal in `MessageItem`

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`

**Step 1: Write minimal implementation**

- Track `copiedSelection` and a timer ref for the selection popup.
- On successful copy, set `copiedSelection` to `true`, then after `1500ms` hide the popup and clear its highlights.
- Reset `copiedSelection` whenever the popup is re-opened for a new selection or dismissed by another path.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Chat/selectionFloatingActions.test.tsx src/components/Chat/MessageItem.test.tsx`

Expected: PASS.

### Task 4: Verify at project level

**Files:**
- Verify: `src/components/Chat/selectionFloatingActions.tsx`
- Verify: `src/components/Chat/selectionFloatingActions.test.tsx`
- Verify: `src/components/Chat/MessageItem.tsx`
- Verify: `src/index.css`

**Step 1: Run full tests**

Run: `npm test`

Expected: PASS.

**Step 2: Run build**

Run: `npm run build`

Expected: PASS.
