# Chat Regenerate Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `Regenerate` action to every assistant turn that reruns generation for that reply from the previous user question using the historical context up to that turn.

**Architecture:** Keep regenerate behavior as a session-level saga action. The UI only dispatches the target assistant message id, and saga reconstructs model input from session history up to the targeted assistant turn. Earlier-turn regenerate does not include later turns below it, so those later turns may become stale and should be warned about in product copy or documentation.

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
- Add a test that validates regenerate finds the previous user message and rebuilds context only up to the targeted assistant turn.
- Add a root multi-model test that validates regenerate updates only the targeted round/tab reply instead of creating a fresh round.

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
- Rebuild model input from session history before the targeted assistant turn.
- Regenerate the targeted reply in place.
- For root multi-model rounds, update only the selected round/tab reply.

**Step 3: Keep existing guards**
- Ignore regenerate for missing session/message, user-role targets, missing prior user prompt, or sessions already loading.

**Step 4: Document stale-turn warning**
- Document that regenerating an upper turn does not automatically recalculate later turns.
- Warn that later turns may be stale after an earlier-turn regenerate.
- Show the warning inline on the regenerated message card and auto-dismiss it after a short delay.

### Task 4: Implement regenerate UI

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/components/Chat/MessageItem.test.tsx`
- Modify: `src/index.css`

**Step 1: Add toolbar action**
- Render `Regenerate` beside `Copy` for assistant turns.
- Disable the action while the session is loading.

**Step 2: Wire action dispatch**
- Dispatch the new regenerate action with `sessionId` and `messageId`.

**Step 3: Add stale-turn warning**
- Detect when the regenerated assistant turn has later turns below it in the same session.
- Show a short inline warning after regenerate: later turns may be stale.
- Auto-dismiss the warning after a short timeout.

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
