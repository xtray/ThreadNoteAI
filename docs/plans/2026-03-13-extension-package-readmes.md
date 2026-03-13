# Extension Package Readmes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dedicated English and Chinese end-user readmes to the offline extension package.

**Architecture:** Keep package documentation in a dedicated repository folder and extend the existing pack script with small helper functions that validate and copy the docs into `dist/` before zipping. Verify the new helper behavior with focused Vitest coverage and confirm the final archive contains both files.

**Tech Stack:** Node.js, npm scripts, Vitest

---

### Task 1: Add failing tests for package readme staging helpers

**Files:**
- Modify: `src/utils/extensionPack.test.ts`
- Modify: `scripts/pack-extension.mjs`

**Step 1: Write the failing test**

```ts
it('maps package doc sources to requested archive filenames', () => {
  expect(getPackageReadmeTargets('/repo')).toEqual([
    { sourcePath: '/repo/package-docs/README.md', targetPath: '/repo/dist/README.md' },
    { sourcePath: '/repo/package-docs/Readme-CN.md', targetPath: '/repo/dist/Readme-CN.md' },
  ]);
});

it('fails when a required package doc source file is missing', async () => {
  await expect(assertFileExists('/missing/README.md')).rejects.toThrow('Required file');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: FAIL because the readme helper functions do not exist yet.

**Step 3: Write minimal implementation**

```js
export const getPackageReadmeTargets = (rootDir) => [...];
export const assertFileExists = async (filePath) => { /* stat + throw */ };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/extensionPack.test.ts scripts/pack-extension.mjs
git commit -m "test: cover package readme staging helpers"
```

### Task 2: Add dedicated package documentation sources

**Files:**
- Create: `package-docs/README.md`
- Create: `package-docs/Readme-CN.md`

**Step 1: Write the failing test**

The helper test from Task 1 will remain red until these source files exist and the pack flow can validate them.

**Step 2: Confirm current gap**

Run: `rg --files package-docs`
Expected: no package documentation files yet.

**Step 3: Write minimal implementation**

Create the two user-facing docs with installation, setup, usage, data, and troubleshooting guidance.

**Step 4: Run verification**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS with the new files present.

**Step 5: Commit**

```bash
git add package-docs/README.md package-docs/Readme-CN.md
git commit -m "docs: add package user guides"
```

### Task 3: Stage the package docs during pack and verify archive contents

**Files:**
- Modify: `scripts/pack-extension.mjs`
- Modify: `scripts/pack-extension.d.mts`

**Step 1: Write the failing test**

Reuse the helper coverage from Task 1 and keep the real pack command as the integration verification.

**Step 2: Run integration check before implementation**

Run: `npm run pack` and inspect the archive.
Expected: zip does not yet contain `README.md` and `Readme-CN.md`.

**Step 3: Write minimal implementation**

Copy the package docs into `dist/` before creating the archive.

**Step 4: Run verification**

Run: `npm test && npm run build && npm run pack`
Expected: PASS, then `unzip -l artifacts/ThreadNoteAI-v<version>.zip` shows both docs.

**Step 5: Commit**

```bash
git add scripts/pack-extension.mjs scripts/pack-extension.d.mts
git commit -m "feat: include package readmes in extension zip"
```
