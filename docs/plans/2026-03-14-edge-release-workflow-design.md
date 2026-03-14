# Edge Release Workflow Design

**User Intent:** Fix the GitHub tag-based release flow so pushing a version tag automatically creates a GitHub Release that contains the Edge extension development zip package.

## Scope
- In scope:
- Keep the existing `v*` tag push trigger.
- Reuse the existing `npm run pack` command to produce the Edge extension zip.
- Change GitHub Actions so the packaged zip is attached to a GitHub Release, not only uploaded as a workflow artifact.
- Keep the release focused on the Edge browser plugin development package only.
- Out of scope:
- Publishing to the Edge Add-ons store or Chrome Web Store.
- Adding manual release triggers.
- Changing the extension package format away from the current zip archive.

## Approach Options
1. Add a second release job after packaging that downloads the built zip and publishes it to GitHub Releases.
- Pros: matches the `tomato` release structure, keeps packaging and publishing responsibilities separate, and leaves a workflow artifact behind for debugging.
- Cons: slightly longer workflow.

2. Publish the zip directly from the packaging job without artifact handoff.
- Pros: fewer steps and a shorter workflow file.
- Cons: less aligned with the reference repository and less convenient to inspect packaged output when release creation fails.

## Recommendation
Choose option 1. It best matches the proven pattern in `/Users/xtray/dev/project/tomato`, keeps the packaging job simple, and ensures a pushed tag reliably creates a GitHub Release with the Edge dev zip attached.

## Workflow Design
- Add `permissions: contents: write` so the workflow can create releases.
- Keep the existing `push.tags: ['v*']` trigger.
- Keep a packaging job on `ubuntu-latest` that runs `npm ci`, `npm test`, and `npm run pack`.
- Upload the generated zip as a workflow artifact so the release job consumes an explicit packaged file.
- Add a follow-up `create-release` job that downloads the artifact and uses `softprops/action-gh-release@v2` to create or update the GitHub Release for the tag.
- Name the release clearly as the Edge development package release for the pushed tag.

## Testing Strategy
- Validate the workflow file structure locally after editing.
- Run `npm test` to confirm the package prerequisites still pass.
- Run `npm run pack` to confirm the expected zip still builds successfully for release upload.

## Risks And Mitigations
- Risk: release creation fails because the workflow token lacks write permission.
- Mitigation: declare `permissions: contents: write` at the workflow level.

- Risk: the release job cannot find the packaged zip.
- Mitigation: keep artifact upload and download paths explicit and fail when no zip matches.

- Risk: a re-pushed tag needs to update the existing release asset.
- Mitigation: enable file overwrite in the release action so the asset can be replaced cleanly.
