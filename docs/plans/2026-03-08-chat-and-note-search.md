# Chat And Note Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full-text sidebar search for AI chats and notebook notes, including hit-centered snippets and keyword highlighting.

**Architecture:** Keep search input state in `App.tsx`, move matching and snippet generation into a dedicated helper module, and render highlighted text segments from derived search results so the sidebar stays declarative.

**Tech Stack:** React, TypeScript, Redux Toolkit, Vitest, CSS

---

### Task 1: Write failing tests for sidebar search helpers

**Files:**
- Create: `src/utils/sidebarSearch.test.ts`

**Step 1: Write the failing test**
- Add tests for:
- AI result falls back to first user summary when query is empty.
- AI result includes later-message snippet when hit is outside the default summary.
- Notebook result prefers title match over content match.
- Query with no match excludes the item.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/sidebarSearch.test.ts`
Expected: FAIL because the helper module does not exist yet.

### Task 2: Implement sidebar search helpers

**Files:**
- Create: `src/utils/sidebarSearch.ts`

**Step 1: Add helper types and normalization**
- Define result objects for sidebar labels and highlight segments.

**Step 2: Implement AI session search derivation**
- Match across all session messages.
- Return default label on empty query.
- Return hit-centered snippet when needed.

**Step 3: Implement notebook note search derivation**
- Prefer title hit.
- Fall back to content snippet.

**Step 4: Implement highlight segmentation**
- Split visible label into matched and unmatched spans for rendering.

### Task 3: Integrate search inputs into the sidebar UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Add separate AI and Notebook search states**
- Track local input state for each tab.

**Step 2: Replace direct list rendering with derived result lists**
- AI list renders filtered session results.
- Notebook list renders filtered note results.

**Step 3: Add empty states and highlighted rendering**
- Show search-specific empty copy when there are no matches.
- Render result labels from highlight segments.

### Task 4: Verify the feature

**Step 1: Re-run targeted helper tests**

Run: `npm test -- src/utils/sidebarSearch.test.ts`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
