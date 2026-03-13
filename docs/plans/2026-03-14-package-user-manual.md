# Package User Manual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the packaged English and Chinese readmes into clearer end-user operating manuals for the offline extension package.

**Architecture:** Keep the package documentation in `package-docs/` and verify the required user-manual sections with focused Vitest assertions. No packaging flow changes are needed beyond reusing the existing copy-into-dist behavior.

**Tech Stack:** Markdown documentation, Vitest

---

### Task 1: Add failing tests for required user-manual sections

**Files:**
- Modify: `src/utils/extensionPack.test.ts`

**Step 1: Write the failing test**

```ts
it('documents the required end-user manual sections', async () => {
  expect(readme).toContain('## Install in Edge (Developer Mode)');
  expect(readme).toContain('## Recommended First-Use Flow');
  expect(readme).toContain('## Update to a New Version');
  expect(readmeCn).toContain('## 在 Edge 中以开发者模式安装');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: FAIL because the packaged readmes do not include all required sections yet.

**Step 3: Write minimal implementation**

Update the packaged readme source files with the required section structure and end-user wording.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/extensionPack.test.ts package-docs/README.md package-docs/Readme-CN.md
git commit -m "docs: refine packaged user manuals"
```

### Task 2: Verify packaged output includes the rewritten manuals

**Files:**
- Modify: `package-docs/README.md`
- Modify: `package-docs/Readme-CN.md`

**Step 1: Write the failing integration expectation**

Run: `npm run pack` and inspect the zip contents and extracted docs.
Expected: current manuals are present but not yet rewritten with the new user-manual sections.

**Step 2: Write minimal implementation**

Rewrite both docs to emphasize install, setup, recommended workflow, feature usage, upgrade, troubleshooting, and safety.

**Step 3: Run verification**

Run: `npm test && npm run build && npm run pack`
Expected: PASS, and `unzip -l artifacts/ThreadNoteAI-v<version>.zip` still contains both docs.

**Step 4: Commit**

```bash
git add package-docs/README.md package-docs/Readme-CN.md
git commit -m "docs: improve packaged offline user guides"
```
