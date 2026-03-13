# Extension Offline Package Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a local packaging command and a tag-triggered GitHub Actions workflow that produce a zip archive for offline Edge extension installation.

**Architecture:** Keep packaging logic in one repository-owned Node script so local development and CI use the exact same flow. Test the naming and validation helpers with Vitest, wire the script into `package.json`, and call it from a new GitHub Actions workflow that runs on tag pushes.

**Tech Stack:** Node.js, npm scripts, Vitest, GitHub Actions

---

### Task 1: Add failing tests for offline package naming and validation helpers

**Files:**
- Create: `src/utils/extensionPack.test.ts`
- Create: `scripts/pack-extension.mjs`

**Step 1: Write the failing test**

```ts
it('builds a versioned archive filename from package metadata', () => {
  expect(getArchiveFileName('1.2.3')).toBe('ThreadNoteAI-v1.2.3.zip');
});

it('rejects a missing dist directory before archiving', async () => {
  await expect(assertDirectoryExists('/missing')).rejects.toThrow('dist');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: FAIL because the pack script helpers do not exist yet.

**Step 3: Write minimal implementation**

```js
export const getArchiveFileName = (version) => `ThreadNoteAI-v${version}.zip`;
export const assertDirectoryExists = async (dirPath) => { /* stat + throw */ };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/extensionPack.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/extensionPack.test.ts scripts/pack-extension.mjs
git commit -m "test: cover extension pack helper behavior"
```

### Task 2: Wire local packaging into npm scripts and docs

**Files:**
- Modify: `package.json`
- Modify: `Readme.md`

**Step 1: Write the failing test**

This task is configuration-only. No extra automated test beyond Task 1 is needed, but keep the local packaging command unimplemented until the helper tests are red and then green.

**Step 2: Run test to verify current gap**

Run: `npm run pack`
Expected: FAIL before the script entry exists.

**Step 3: Write minimal implementation**

```json
"pack": "npm run build && node scripts/pack-extension.mjs"
```

Document that the zip is written to `artifacts/` and must be unzipped before loading in Edge.

**Step 4: Run verification**

Run: `npm run pack`
Expected: PASS and create `artifacts/ThreadNoteAI-v<version>.zip`

**Step 5: Commit**

```bash
git add package.json Readme.md
git commit -m "feat: add local extension pack command"
```

### Task 3: Add tag-triggered GitHub Actions packaging workflow

**Files:**
- Create: `.github/workflows/package-extension.yml`

**Step 1: Write the failing test**

This task is workflow configuration. Validation comes from running the shared local command and reviewing workflow syntax rather than a dedicated unit test.

**Step 2: Confirm current absence**

Run: `rg --files .github/workflows`
Expected: no workflow file for packaging.

**Step 3: Write minimal implementation**

```yaml
on:
  push:
    tags:
      - 'v*'
jobs:
  package:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run pack
      - uses: actions/upload-artifact@v4
```

Upload `artifacts/*.zip` and name the artifact with the pushed tag.

**Step 4: Run verification**

Run: `npm test && npm run build && npm run pack`
Expected: PASS locally, giving confidence that the workflow command path is valid.

**Step 5: Commit**

```bash
git add .github/workflows/package-extension.yml
git commit -m "ci: package extension on tags"
```
