# Main Model Selector Single-Row Dropdown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** In main window multi-model selector, show only first row by default, auto-expand full list on hover/focus, and keep selected models pinned to top for visibility.

**Architecture:** Keep current chip-based selector but add deterministic option ordering (selected first) and CSS-driven collapsed/expanded dropdown behavior. Minimize state changes and preserve existing selection constraints.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Add failing test for model ordering helper

**Files:**
- Create: `src/components/Chat/ChatContainer.test.ts`
- Modify: `src/components/Chat/ChatContainer.tsx`

**Step 1: Write failing test**
- Assert selected model ids are ordered first and remaining options keep original order.
- Assert unknown selected ids are ignored.

**Step 2: Run test to verify red**
Run: `npm test -- src/components/Chat/ChatContainer.test.ts`
Expected: FAIL (helper export/behavior missing).

### Task 2: Implement ordering + single-row dropdown behavior

**Files:**
- Modify: `src/components/Chat/ChatContainer.tsx`
- Modify: `src/index.css`

**Step 1: Implement helper + apply ordered rendering**
- Add pure helper for selected-first ordering.
- Use ordered list in chip rendering.

**Step 2: Implement collapsed-first-row + hover/focus dropdown**
- Main selector container fixed single-row height by default.
- On hover/focus-within, chip list becomes dropdown panel showing full list.

**Step 3: Run tests/build**
Run:
- `npm test -- src/components/Chat/ChatContainer.test.ts`
- `npm test`
- `npm run build`
Expected: PASS.
