# Turn Toolbar Copy Markdown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an extensible per-turn assistant toolbar (ChatGPT/Copilot-like style) with one action now: copy current turn question+answer as Markdown, supported in both main window and sub-session overlay.

**Architecture:** Introduce reusable turn utility helpers (turn pairing + markdown building + think-block stripping), a reusable `TurnToolbar` component for extensibility, and integrate it into `MessageItem` and `FloatingOverlay` assistant message rendering.

**Tech Stack:** React, TypeScript, Vitest, CSS

---

### Task 1: Add failing tests for turn markdown formatting helpers

**Files:**
- Create: `src/components/Chat/turnUtils.test.ts`
- Create: `src/components/Chat/turnUtils.ts` (stub if needed)

**Steps:**
1. Write tests for:
- pairing assistant index to previous user question
- markdown output format
- think block stripping from copied answer.
2. Run tests and verify RED.

### Task 2: Implement turn utilities and reusable toolbar component

**Files:**
- Modify/Create: `src/components/Chat/turnUtils.ts`
- Create: `src/components/Chat/TurnToolbar.tsx`

**Steps:**
1. Implement pure helper functions:
- `findTurnQuestionContent`
- `stripThinkBlocks`
- `buildTurnMarkdown`
- clipboard helper with fallback.
2. Implement generic toolbar component with extensible action array.

### Task 3: Integrate toolbar into main and sub-session assistant replies

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/components/Chat/FloatingOverlay.tsx`
- Modify: `src/index.css`

**Steps:**
1. For assistant replies, render toolbar at end of reply.
2. Copy action copies current turn Q+A markdown with model name label.
3. Keep design subtle, modern, and extensible for future actions.

### Task 4: Verification

**Commands:**
- `npm test -- src/components/Chat/turnUtils.test.ts`
- `npm test`
- `npm run build`

Expected: pass.
