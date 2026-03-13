# Package Upgrade Checklist Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a short pre-upgrade export checklist to the packaged English and Chinese user manuals.

**Architecture:** Reuse the existing `package-docs/` manuals and extend the focused documentation test so the new checklist section stays present in future edits. No packaging code changes are needed.

**Tech Stack:** Markdown documentation, Vitest

---

### Task 1: Add a failing test for the checklist section

**Files:**
- Modify: `src/utils/extensionPack.test.ts`

**Step 1: Write the failing test**

```ts
expect(englishReadme).toContain('## Before You Upgrade');
expect(chineseReadme).toContain('## 升级前建议先导出这些数据');
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: FAIL because the new checklist section does not exist yet.

**Step 3: Write minimal implementation**

Add the new three-item checklist to both manuals right before the upgrade section.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS

### Task 2: Verify packaged output still includes the updated manuals

**Files:**
- Modify: `package-docs/README.md`
- Modify: `package-docs/Readme-CN.md`

**Step 1: Run verification**

Run: `npm test && npm run build && npm run pack`
Expected: PASS
