# Math Rendering Implementation Plan

**Goal:** Render AI-generated math in conversation messages.
**Architecture:** Normalize delimiters outside parsed code ranges, then use remark-math and rehype-katex with local CSS/fonts.
**Tech Stack:** React Markdown, unified, KaTeX, Vitest.

1. Add regression tests in MessageContent.test.tsx for four delimiters, unchanged code, incomplete and invalid formulas, and search interaction. Run targeted tests and confirm missing rendering failures.
2. Implement src/utils/mathMarkdown.ts with code-aware delimiter normalization. Wire both Markdown instances in MessageContent.tsx and add overflow styling.
3. Run targeted tests, full npm test, npm run build, git diff --check, and independent code review. Sync only this fix into current working directory, retaining prior continuation changes.
