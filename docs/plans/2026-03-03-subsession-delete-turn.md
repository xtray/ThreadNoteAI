# Sub-session Turn Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add right-click turn deletion to sub-session chat, deleting the matched user+assistant pair for the clicked message.

**Architecture:** Keep turn-pair matching as a reducer concern so both main and sub-session UI can reuse one deletion rule. Extend overlay context menu actions to include delete-turn while preserving add-to-note behavior.

**Tech Stack:** React, Redux Toolkit, TypeScript, Vitest

---

### Task 1: Add failing reducer tests for assistant-click turn deletion

**Files:**
- Modify: `package.json`
- Create: `src/store/slices/sessionSlice.test.ts`

**Step 1: Write the failing test**

Create tests that dispatch `removeTurn` using an assistant message id and assert the corresponding user+assistant pair is removed.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/slices/sessionSlice.test.ts`
Expected: FAIL because reducer currently only supports `userMessageId` payload and cannot resolve assistant-clicked turns.

**Step 3: Commit**

```bash
git add package.json package-lock.json src/store/slices/sessionSlice.test.ts
git commit -m "test: cover turn deletion by clicked assistant message"
```

### Task 2: Implement reducer turn matching by clicked message id

**Files:**
- Modify: `src/store/slices/sessionSlice.ts`
- Test: `src/store/slices/sessionSlice.test.ts`

**Step 1: Write minimal implementation**

Change `removeTurn` payload to use `messageId`, resolve the owning user turn in reducer, and delete matched pair + linked sub-session trees.

**Step 2: Run tests**

Run: `npm test -- src/store/slices/sessionSlice.test.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/store/slices/sessionSlice.ts src/store/slices/sessionSlice.test.ts
git commit -m "feat: support clicked-message turn deletion in reducer"
```

### Task 3: Add sub-session overlay right-click delete action

**Files:**
- Modify: `src/components/Chat/FloatingOverlay.tsx`
- Modify: `src/components/Chat/MessageItem.tsx`

**Step 1: Write failing UI-path expectation via reducer test extension**

Extend reducer tests if needed to reflect payload shape used by UI (`messageId`).

**Step 2: Write minimal UI implementation**

- Add user-message context menu in overlay with `Delete turn`.
- Add `Delete turn` entry for assistant context menu while preserving `Add to note`.
- Dispatch `removeTurn({ sessionId, messageId: turnUserMessageId })` from both main message and overlay.

**Step 3: Verify build**

Run: `npm run build`
Expected: TypeScript and Vite build succeed.

**Step 4: Commit**

```bash
git add src/components/Chat/FloatingOverlay.tsx src/components/Chat/MessageItem.tsx
git commit -m "feat: add sub-session context-menu turn deletion"
```
