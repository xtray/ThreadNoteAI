# Notebook Markdown Editor Design

## Context

The current notebook editor in [src/components/Notebook/NotebookViewer.tsx](/Users/xtray/dev/project/ThreadNoteAI/src/components/Notebook/NotebookViewer.tsx) splits note content into markdown blocks. Each block is either a rendered `react-markdown` view or an active `textarea`. That block-level model causes two core usability failures:

- Mouse selection cannot extend across block boundaries.
- `Ctrl+A` only selects within the active block instead of the whole note.

The user wants a much more Typora/Obsidian-like single-surface editing experience: live rendering in-place, not a left/right split editor, while preserving free-form selection across the full note.

## Goals

- Support mouse drag selection across arbitrary note length.
- Support `Ctrl+A` to select the entire note.
- Stay close to a WYSIWYG markdown experience.
- Keep note autosave and task list toggling.
- Build multiple isolated candidate implementations with git worktrees so the user can choose.

## Non-Goals

- Full Typora feature parity.
- Markdown AST-perfect roundtripping for every obscure edge case.
- Adding heavy new editor dependencies that require network install.

## Candidate Approaches

### Option A: Whole-note textarea editor

Replace block editing with a single note-level `textarea` while editing, and keep rendered markdown when not editing.

Pros:
- Fastest and safest.
- Immediately fixes drag selection and `Ctrl+A`.
- Minimal risk to autosave and persistence.

Cons:
- Not truly WYSIWYG while focused.
- Less Typora-like than requested.

### Option B: Overlay live-preview editor

Keep a single note-level `textarea` for true text selection/input, but visually overlay it on top of a synchronized rendered markdown layer so the editing surface feels closer to live-rendered markdown.

Pros:
- Single document selection model.
- Keeps native textarea behavior for long selections and `Ctrl+A`.
- Closer visually to Typora than Option A without adding dependencies.

Cons:
- Caret/line-wrap alignment is delicate.
- Code blocks, lists, and mixed typography can drift visually.
- More CSS complexity and browser quirks.

### Option C: Native WYSIWYG-lite contenteditable surface

Replace block editing with one note-level `contentEditable` surface that renders markdown-derived structure inline and keeps the full note in a single editable DOM tree.

Pros:
- Closest to Typora/Obsidian interaction model.
- Full-note mouse selection and `Ctrl+A` work naturally.
- Real in-place rendering instead of mode-separated blocks.

Cons:
- Highest implementation complexity.
- Requires careful DOM-to-markdown serialization.
- More behavioral edge cases around paste, line breaks, and code fences.

## Recommendation

Build all three and recommend Option C if verification is acceptable, because it is the only path that materially addresses both user requirements and the requested Typora/Obsidian direction.

Fallback recommendation is Option A if Option C proves too fragile. Option B is useful as an intermediate reference but is less robust than A and less faithful than C.

## Architecture Notes

- All options keep note persistence in Redux unchanged by still calling `upsertNote`.
- All options collapse editing to one document-level surface so selection is no longer block-scoped.
- Search highlight support may be reduced while actively editing, but rendered mode should retain it.
- Task list checkbox toggling should continue to work in rendered mode where possible.

## Verification Strategy

- Add notebook viewer tests covering whole-note selection affordances and mode switching.
- Run `npm test`.
- Run `npm run build`.
- Compare user-facing behavior and code complexity across worktrees.
