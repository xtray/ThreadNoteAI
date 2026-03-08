# Search Jump And Highlight Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade sidebar search so selecting a chat or note jumps the right pane to the first match and highlights all matches until the search query is cleared.

**Architecture:** Keep sidebar search state in `App.tsx`, pass the active query into `ChatContainer` and `NotebookViewer`, and use shared search helpers to find matches, inject highlight spans, and scroll the first visible match into view. Chat auto-scroll to bottom is suppressed while a search query is active so search navigation wins over live-tail behavior.

**Tech Stack:** React, TypeScript, react-markdown, Vitest, CSS

---

### Task 1: Write failing tests for shared search helpers

**Files:**
- Modify: `src/utils/sidebarSearch.test.ts`
- Create: `src/utils/searchNavigation.ts`

**Step 1: Write the failing test**
- Add tests for:
- session search returns the first matching message index and offset.
- note search prefers title matches, then returns content match metadata.
- query clearing returns no active match metadata.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/sidebarSearch.test.ts`
Expected: FAIL because the new navigation helpers do not exist yet.

### Task 2: Implement shared match navigation helpers

**Files:**
- Modify: `src/utils/sidebarSearch.ts`

**Step 1: Add reusable normalized query helper**
- Export one canonical normalization path for sidebar search and right-pane highlight behavior.

**Step 2: Add session and note match metadata helpers**
- Return enough info to identify the first matching message or note section.
- Keep current sidebar snippet behavior intact.

**Step 3: Verify helper tests pass**

Run: `npm test -- src/utils/sidebarSearch.test.ts`
Expected: PASS

### Task 3: Add right-pane search highlight and jump behavior

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Chat/ChatContainer.tsx`
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/components/Chat/MessageContent.tsx`
- Modify: `src/components/Notebook/NotebookViewer.tsx`
- Modify: `src/index.css`

**Step 1: Thread active search query into the right pane**
- Pass active AI query into `ChatContainer`.
- Pass active note query into `NotebookViewer`.

**Step 2: Inject search highlights into rendered markdown/text**
- Highlight all visible matches in AI responses and notebook markdown blocks.
- Remove those highlights whenever the query becomes empty.

**Step 3: Jump to the first match**
- AI chat scrolls to the first rendered search hit instead of the conversation end when search is active.
- Notebook scrolls to the first hit in the current note.

**Step 4: Preserve existing non-search behavior**
- Existing annotation highlights, selection menus, and note editing keep working.
- Default auto-scroll to bottom still applies when no search query is active.

### Task 4: Verify the upgraded behavior

**Step 1: Re-run targeted helper tests**

Run: `npm test -- src/utils/sidebarSearch.test.ts`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
