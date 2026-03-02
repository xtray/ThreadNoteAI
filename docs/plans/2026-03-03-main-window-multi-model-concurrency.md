# Main Window Multi-Model Concurrency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable up to 3 concurrent model replies in the main chat window with tabbed viewing, selectable primary reply context, configurable concurrency defaults, and strict single-model behavior for sub-sessions.

**Architecture:** Extend session/config state to represent per-round multi-model responses in root sessions while preserving existing linear message history as the primary-context chain. Update saga flow to run per-model streaming calls concurrently for root sessions and keep current single-stream flow for sub-sessions. Add settings and main-window UI for model concurrency controls, per-round model selection persistence, tab switching, and primary-reply promotion.

**Tech Stack:** React, Redux Toolkit, Redux-Saga, TypeScript, Vitest, IndexedDB persistence

---

### Task 1: Add failing state tests for multi-model rounds and selection inheritance

**Files:**
- Create: `src/store/slices/configSlice.test.ts`
- Modify: `src/store/slices/sessionSlice.test.ts`

**Step 1: Write failing tests for config concurrency defaults**

```ts
describe('config multi-model defaults', () => {
  it('clamps max concurrent models to 1..3 and trims default list');
  it('keeps default model list unique and valid');
});
```

**Step 2: Write failing tests for session primary-reply behavior**

```ts
describe('session multi-model rounds', () => {
  it('promotes selected model reply as primary context');
  it('inherits last used main models when no override is provided');
});
```

**Step 3: Verify RED**

Run: `npm test -- src/store/slices/configSlice.test.ts src/store/slices/sessionSlice.test.ts`
Expected: FAIL due missing multi-model state/actions.

### Task 2: Implement config/session/db state model for root multi-model rounds

**Files:**
- Modify: `src/store/slices/configSlice.ts`
- Modify: `src/store/slices/sessionSlice.ts`
- Modify: `src/utils/db.ts`
- Modify: `src/store/sagas/persistenceSaga.ts`
- Test: `src/store/slices/configSlice.test.ts`
- Test: `src/store/slices/sessionSlice.test.ts`

**Step 1: Add config fields and reducers**

Implement:
- `maxConcurrentMainModels: number` (1..3)
- `defaultMainModelIds: string[]` (length 1..3)
- reducers to set max and per-slot defaults with model validation.

**Step 2: Add root-session multi-model fields/actions**

Implement state for:
- per-round response collection
- active tab model id
- primary model id
- last used main model ids
- promotion of selected tab to primary context message.

**Step 3: Persist new fields in IndexedDB/session serialization**

Store/load new root-session fields while defaulting missing values for old sessions.

**Step 4: Verify GREEN**

Run: `npm test -- src/store/slices/configSlice.test.ts src/store/slices/sessionSlice.test.ts`
Expected: PASS.

### Task 3: Add failing saga tests for root concurrent requests and stop-all behavior

**Files:**
- Create: `src/store/sagas/aiSaga.test.ts`
- Modify: `src/store/sagas/aiSaga.ts`

**Step 1: Write failing saga-level tests**

Cover:
- root session sends one user message and concurrent assistant placeholders for selected models
- stream updates stay isolated by model-tab message
- stop action aborts all running model requests in that root round
- sub-session still uses single model flow.

**Step 2: Verify RED**

Run: `npm test -- src/store/sagas/aiSaga.test.ts`
Expected: FAIL because current saga is single-stream per session.

### Task 4: Implement concurrent root saga execution with primary-context chaining

**Files:**
- Modify: `src/store/sagas/aiSaga.ts`
- Modify: `src/store/slices/sessionSlice.ts`
- Test: `src/store/sagas/aiSaga.test.ts`

**Step 1: Implement root-session multi-stream send flow**

- Resolve selected model list (override -> last used -> config default).
- Spawn concurrent stream calls (Promise/allSettled) per selected model.
- Track per-model abort controllers and round status.

**Step 2: Implement primary reply promotion rules**

- Auto-select first model as primary if user did not set one.
- When user sets tab as primary, update main linear assistant message for context chain.

**Step 3: Keep sub-session behavior unchanged**

Branch by `parentId !== null` for existing single-stream path.

**Step 4: Verify GREEN**

Run: `npm test -- src/store/sagas/aiSaga.test.ts`
Expected: PASS.

### Task 5: Add main-window UI for model selection, tabs, and primary reply

**Files:**
- Modify: `src/components/Chat/ChatContainer.tsx`
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/index.css`

**Step 1: Build settings UI for concurrency and default model slots**

- max concurrent models select (1..3)
- per-thread default model selectors (slot 1..3)
- enforce uniqueness and cap by max.

**Step 2: Build main-window per-round model picker and modern tabs**

- temporary per-round model selection (checkbox-like chip list)
- tabbed assistant response view for the latest round
- clear “Set as primary reply” action.

**Step 3: Keep sub-session UI single-model**

No multi-tab UI changes in `FloatingOverlay`; existing model selector remains.

**Step 4: Verify build**

Run: `npm run build`
Expected: TypeScript + Vite build pass.

### Task 6: Final verification and regression checks

**Files:**
- Modify: `src/components/Chat/ChatContainer.tsx` (if needed)
- Modify: `src/store/sagas/aiSaga.ts` (if needed)

**Step 1: Run full tests**

Run: `npm test`
Expected: all tests pass.

**Step 2: Run production build**

Run: `npm run build`
Expected: build passes with no TypeScript errors.

**Step 3: Manual behavior checklist**

- root main window can send to 1~3 models concurrently
- tab switch reflects each model reply
- selecting primary tab affects next-round context
- temporary selection persists as next-round default
- sub-session remains single-model and still allows sub-session creation from tab content.
