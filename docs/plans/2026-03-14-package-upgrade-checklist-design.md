# Package Upgrade Checklist Design

**User Intent:** Add a short pre-upgrade export checklist to the packaged user manuals so trial users know what to back up before installing a new version.

## Scope
- In scope:
- Add a compact three-item checklist to both packaged manuals.
- Place the checklist immediately before the upgrade section.
- Keep the wording simple and action-oriented.
- Out of scope:
- Changing package structure or upgrade flow.
- Adding new export functionality in the product.

## Recommendation
Use a short dedicated subsection before the upgrade instructions. This keeps the message visible at the exact moment the user is preparing to replace the extension and avoids burying backup advice inside longer paragraphs.

## Checklist Content
- Export AI chat history
- Export AI configuration
- Export Notebook data

The Chinese manual should mirror the same three items in natural Chinese phrasing.

## Testing Strategy
- Extend the packaged readme test to assert the new checklist section title exists in both docs.
- Run the focused test first to confirm it fails.
- After updating the docs, rerun the focused test and then full verification with `npm test && npm run build && npm run pack`.
