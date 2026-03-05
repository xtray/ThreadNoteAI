# Chat Code Block Copy Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-code-block copy button at bottom-right for assistant markdown code blocks in chat replies.

**Architecture:** Extend `MessageContent` with a custom markdown `code` renderer for non-inline code blocks, reuse existing clipboard utility, and gate behavior from `MessageItem` so only assistant replies show the button.

**Tech Stack:** React, TypeScript, react-markdown, Vitest, CSS

---

### Task 1: Write failing tests for code block copy button rendering

**Files:**
- Create: `src/components/Chat/MessageContent.test.tsx`

**Step 1: Write failing tests**
- Add tests that assert:
- fenced code block renders copy button when feature enabled.
- inline code does not render copy button.
- fenced code block does not render copy button when feature disabled.

**Step 2: Run test to verify RED**
Run: `npm test -- src/components/Chat/MessageContent.test.tsx`
Expected: FAIL because copy-button behavior is not yet implemented.

### Task 2: Implement copy button in markdown code blocks

**Files:**
- Modify: `src/components/Chat/MessageContent.tsx`

**Step 1: Add feature gate prop**
- Introduce `enableCodeBlockCopy?: boolean` in props.

**Step 2: Add custom code renderer**
- Inline code path remains unchanged.
- Block code path wraps `pre/code` and adds copy button.

**Step 3: Add copy interaction state**
- Track copied block id.
- Reset after short timeout.
- Stop propagation on button events.

### Task 3: Enable assistant-only behavior and styling

**Files:**
- Modify: `src/components/Chat/MessageItem.tsx`
- Modify: `src/index.css`

**Step 1: Pass feature gate from assistant messages**
- `enableCodeBlockCopy={message.role === 'assistant'}`

**Step 2: Add styles**
- Wrapper positions button in code block bottom-right.
- Ensure code text is not obscured by button.

### Task 4: Verification

**Step 1: Re-run targeted test**
Run: `npm test -- src/components/Chat/MessageContent.test.tsx`
Expected: PASS

**Step 2: Full test suite**
Run: `npm test`
Expected: PASS

**Step 3: Build verification**
Run: `npm run build`
Expected: PASS
