# Package Trial User Manual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the packaged English and Chinese manuals better suited for trial users by adding a compact install troubleshooting table and slight tone refinements.

**Architecture:** Reuse the existing packaged readme files in `package-docs/` and extend the focused documentation test to require the new troubleshooting section. No packaging script changes are needed because the docs are already copied into the archive during `npm run pack`.

**Tech Stack:** Markdown documentation, Vitest

---

### Task 1: Add a failing test for the troubleshooting section

**Files:**
- Modify: `src/utils/extensionPack.test.ts`

**Step 1: Write the failing test**

```ts
expect(englishReadme).toContain('## Install Troubleshooting');
expect(chineseReadme).toContain('## 安装失败排查对照表');
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: FAIL because the manuals do not yet include the troubleshooting section.

**Step 3: Write minimal implementation**

Update both packaged manuals with the new troubleshooting section and trial-user wording refinements.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS

### Task 2: Verify the updated manuals are still packaged

**Files:**
- Modify: `package-docs/README.md`
- Modify: `package-docs/Readme-CN.md`

**Step 1: Run integration verification**

Run: `npm test && npm run build && npm run pack`
Expected: PASS

**Step 2: Inspect archive contents**

Run: `unzip -l artifacts/ThreadNoteAI-v<version>.zip`
Expected: both `README.md` and `Readme-CN.md` remain present in the package.
