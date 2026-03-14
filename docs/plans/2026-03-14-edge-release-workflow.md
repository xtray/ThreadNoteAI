# Edge Release Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `git push origin <tag>` automatically publish a GitHub Release containing the Edge extension development zip package.

**Architecture:** Keep the existing repository-owned pack command as the single source of truth for the zip package. Update the GitHub Actions workflow to separate packaging from publishing: first build and upload the zip as an artifact, then create the GitHub Release from that artifact using the same tag event.

**Tech Stack:** GitHub Actions, Node.js, npm, softprops/action-gh-release

---

### Task 1: Update the release workflow to publish a GitHub Release

**Files:**
- Modify: `.github/workflows/package-extension.yml`

**Step 1: Confirm the current gap**

Run: `sed -n '1,240p' .github/workflows/package-extension.yml`
Expected: the workflow uploads an artifact but does not create a GitHub Release.

**Step 2: Write minimal implementation**

- Add workflow-level `permissions: contents: write`.
- Keep the existing packaging job and artifact upload.
- Add a `create-release` job that depends on `package`.
- Download the uploaded artifact into a release asset directory.
- Use `softprops/action-gh-release@v2` to create or update the release for the pushed tag and upload the packaged zip.

**Step 3: Validate the workflow shape**

Run: `sed -n '1,260p' .github/workflows/package-extension.yml`
Expected: a two-job workflow with packaging plus release publishing.

### Task 2: Verify packaging still succeeds for release upload

**Files:**
- Modify: `.github/workflows/package-extension.yml`

**Step 1: Run project verification**

Run: `npm test`
Expected: PASS

**Step 2: Run package build**

Run: `npm run pack`
Expected: PASS and create `artifacts/ThreadNoteAI-v<version>.zip`

**Step 3: Review produced archive path**

Run: `ls artifacts`
Expected: the versioned zip exists and matches the workflow upload glob.
