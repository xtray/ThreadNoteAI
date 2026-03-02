# Session Multi-Reply Toggle and Model Badge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-main-session quick toggle (default on) to switch between multi-model concurrent replies and primary-only replies, and show model attribution badge in assistant content UI.

**Architecture:** Extend root session state with `multiReplyEnabled` and message-level `modelId` metadata. Update root saga model selection to respect session toggle. Add compact toggle UI in the primary action row and render assistant model badge in message bubbles.

**Tech Stack:** React, Redux Toolkit, Redux-Saga, TypeScript, Vitest, CSS

---

### Task 1: Add failing tests for toggle/model-selection behavior

**Files:**
- Modify: `src/store/slices/sessionSlice.test.ts`
- Modify: `src/store/sagas/aiSaga.test.ts`

**Steps:**
1. Add reducer tests for root session `multiReplyEnabled` default and update action behavior.
2. Add saga helper test: when multi reply disabled, selected model list resolves to current primary only.
3. Run targeted tests and confirm failures.

### Task 2: Implement state + saga + persistence updates

**Files:**
- Modify: `src/store/slices/sessionSlice.ts`
- Modify: `src/store/sagas/aiSaga.ts`
- Modify: `src/store/sagas/persistenceSaga.ts`
- Modify: `src/utils/db.ts`

**Steps:**
1. Add `multiReplyEnabled` to root sessions (default true).
2. Add action to set per-session multi-reply toggle.
3. Add `modelId` metadata on assistant messages and support updating it via `updateMessage`.
4. Update root saga model resolution to force primary-only when toggle off.
5. Persist/load new session fields.

### Task 3: Implement UI toggle + model badge

**Files:**
- Modify: `src/components/Chat/ChatContainer.tsx`
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/index.css`

**Steps:**
1. Add quick toggle button beside `Set as primary` (modern compact style).
2. Toggle controls only current root session.
3. Show model badge in assistant message bubble (top of content), including latest active-tab override message.
4. Keep sub-session behavior unchanged.

### Task 4: Verification

**Commands:**
- `npm test -- src/store/slices/sessionSlice.test.ts src/store/sagas/aiSaga.test.ts`
- `npm test`
- `npm run build`

Expected: all pass.
