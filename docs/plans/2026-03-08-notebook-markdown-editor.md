# Notebook Markdown Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and verify three isolated notebook markdown editor implementations that fix whole-note mouse selection and `Ctrl+A`, then compare them and recommend the best one.

**Architecture:** Keep the current note persistence flow but replace block-scoped editing with document-scoped editing. Implement three variants in isolated git worktrees so the code and verification remain independent and directly comparable.

**Tech Stack:** React, TypeScript, Redux Toolkit, react-markdown, Vitest, CSS, git worktrees

---

### Task 1: Add design and comparison scaffolding

**Files:**
- Create: `docs/plans/2026-03-08-notebook-markdown-editor-design.md`
- Create: `docs/plans/2026-03-08-notebook-markdown-editor.md`

**Step 1: Write the design doc**

Document the existing block-based limitation, the three candidate approaches, and the recommendation criteria.

**Step 2: Save the implementation plan**

Describe the worktree-per-approach execution flow and verification commands.

### Task 2: Create isolated worktrees

**Files:**
- Modify: `.worktrees/codex/note-editor-textarea/*`
- Modify: `.worktrees/codex/note-editor-overlay/*`
- Modify: `.worktrees/codex/note-editor-contenteditable/*`

**Step 1: Create branch/worktree for Option A**

Run: `git worktree add .worktrees/codex-note-editor-textarea -b codex/note-editor-textarea`

**Step 2: Create branch/worktree for Option B**

Run: `git worktree add .worktrees/codex-note-editor-overlay -b codex/note-editor-overlay`

**Step 3: Create branch/worktree for Option C**

Run: `git worktree add .worktrees/codex-note-editor-contenteditable -b codex/note-editor-contenteditable`

### Task 3: Write failing notebook tests per option

**Files:**
- Create: `src/components/Notebook/NotebookViewer.test.tsx`

**Step 1: Write tests for whole-note editing entry**

Cover:
- focusing the notebook enters one document-level editor surface
- `Ctrl+A` is handled at note scope rather than block scope
- exiting edit mode persists content

**Step 2: Run tests to verify failure**

Run: `npm test -- src/components/Notebook/NotebookViewer.test.tsx`
Expected: FAIL because current block editor does not provide a single note-level editor.

### Task 4: Implement Option A in its worktree

**Files:**
- Modify: `src/components/Notebook/NotebookViewer.tsx`
- Modify: `src/index.css`
- Create/Modify: `src/components/Notebook/NotebookViewer.test.tsx`

**Step 1: Replace block editing with whole-note textarea**

Keep rendered markdown in view mode and switch to one full-note `textarea` on focus.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Notebook/NotebookViewer.test.tsx`

**Step 3: Run full verification**

Run: `npm test`
Run: `npm run build`

### Task 5: Implement Option B in its worktree

**Files:**
- Modify: `src/components/Notebook/NotebookViewer.tsx`
- Modify: `src/index.css`
- Create/Modify: `src/components/Notebook/NotebookViewer.test.tsx`

**Step 1: Build textarea plus synchronized rendered overlay**

Use one note-level editing surface while visually keeping rendered markdown underneath.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Notebook/NotebookViewer.test.tsx`

**Step 3: Run full verification**

Run: `npm test`
Run: `npm run build`

### Task 6: Implement Option C in its worktree

**Files:**
- Modify: `src/components/Notebook/NotebookViewer.tsx`
- Modify: `src/index.css`
- Create/Modify: `src/components/Notebook/NotebookViewer.test.tsx`

**Step 1: Build single-surface contenteditable editor**

Render the note as one editable DOM tree and serialize it back to markdown-compatible text for persistence.

**Step 2: Run targeted tests**

Run: `npm test -- src/components/Notebook/NotebookViewer.test.tsx`

**Step 3: Run full verification**

Run: `npm test`
Run: `npm run build`

### Task 7: Compare and recommend

**Files:**
- No required file changes

**Step 1: Capture tradeoffs**

Compare:
- fidelity to Typora/Obsidian
- selection behavior
- maintenance risk
- rendering fidelity

**Step 2: Recommend the best branch**

Choose the highest-value implementation and summarize why.
