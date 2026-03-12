# Sub-session Code Block Copy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable code-block copy buttons inside sub-session assistant replies.

**Architecture:** Reuse the existing `MessageContent` markdown code-block copy path by passing the existing feature flag from `FloatingOverlay`. Verify the overlay wiring with a focused regression test.

**Tech Stack:** React, TypeScript, Vitest, react-dom/server

---

### Task 1: Add a failing overlay regression test

**Files:**
- Create: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Write the failing test**

- Render a minimal sub-session overlay tree with one assistant fenced code block reply.
- Assert the generated HTML contains `code-block-copy-btn`.
- Render a user fenced code block message and assert the copy button is absent.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`

Expected: FAIL because `FloatingOverlay` does not yet pass `enableCodeBlockCopy`.

### Task 2: Wire overlay messages to the existing copy capability

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.tsx`

**Step 1: Write minimal implementation**

- Pass `enableCodeBlockCopy={m.role === 'assistant'}` to `MessageContent` in the overlay message list.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Chat/FloatingOverlay.test.tsx`

Expected: PASS.

### Task 3: Verify the change

**Files:**
- Verify: `src/components/Chat/FloatingOverlay.tsx`
- Verify: `src/components/Chat/FloatingOverlay.test.tsx`

**Step 1: Run broader verification**

Run: `npm test`

Expected: PASS.

**Step 2: Run build verification**

Run: `npm run build`

Expected: PASS.
