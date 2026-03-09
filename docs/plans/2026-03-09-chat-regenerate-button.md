# Chat Regenerate Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `Regenerate` action to every assistant turn that deletes the current reply content and reruns generation from the previous user question.

**Architecture:** Keep regenerate behavior as a session-level saga action. The UI only dispatches the target assistant message id, session state removes that assistant message, and saga reuses the existing `sessions/sendMessage` pipeline so single-model and root multi-model generation stay consistent.

**Tech Stack:** React, Redux Toolkit, redux-saga, TypeScript, Vitest, CSS

---

### Task 1: Write failing tests for regenerate rendering and state helpers

**Files:**
- Modify: `src/components/Chat/ChatContainer.test.ts`
- Modify: `src/store/slices/sessionSlice.test.ts`

**Step 1: Write failing tests**
- Add a `ChatContainer` helper test that assistant messages expose a regenerate affordance and user messages do not.
- Add a reducer test that removes only the targeted assistant message when regenerate cleanup runs.

**Step 2: Run test to verify RED**
Run: `npm test -- src/components/Chat/ChatContainer.test.ts src/store/slices/sessionSlice.test.ts`
Expected: FAIL because regenerate UI/state support does not exist yet.

### Task 2: Write failing saga test for regenerate flow

**Files:**
- Modify: `src/store/sagas/aiSaga.test.ts`

**Step 1: Write failing test**
- Add a test that validates regenerate finds the previous user message and routes back into send handling.

**Step 2: Run test to verify RED**
Run: `npm test -- src/store/sagas/aiSaga.test.ts`
Expected: FAIL because regenerate action handling does not exist yet.

### Task 3: Implement regenerate state and saga behavior

**Files:**
- Modify: `src/store/slices/sessionSlice.ts`
- Modify: `src/store/sagas/aiSaga.ts`

**Step 1: Add reducer support**
- Add a reducer to remove a specific assistant message without deleting the paired user turn.

**Step 2: Add regenerate saga entry**
- Add a `sessions/regenerateMessage` saga handler.
- Resolve the target assistant message and its preceding user message.
- Remove the targeted assistant message.
- Dispatch the existing send flow with the recovered prompt.

**Step 3: Keep existing guards**
- Ignore regenerate for missing session/message, user-role targets, missing prior user prompt, or sessions already loading.

### Task 4: Implement regenerate UI

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`

**Step 1: Add toolbar action**
- Render `Regenerate` beside `Copy` for assistant turns.
- Disable the action while the session is loading.

**Step 2: Wire action dispatch**
- Dispatch the new regenerate action with `sessionId` and `messageId`.

### Task 5: Verification

**Step 1: Re-run targeted tests**
Run: `npm test -- src/components/Chat/ChatContainer.test.ts src/store/slices/sessionSlice.test.ts src/store/sagas/aiSaga.test.ts`
Expected: PASS

**Step 2: Full test suite**
Run: `npm test`
Expected: PASS

**Step 3: Build verification**
Run: `npm run build`
Expected: PASS
