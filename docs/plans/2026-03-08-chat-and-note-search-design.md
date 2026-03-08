# Chat And Note Search Design

**User Intent:** Add search to the AI chat conversation list and the Notebook tab note list, with full-text matching and visible keyword highlights in the sidebar results.

## Scope
- In scope:
- AI sidebar search across all messages in each root chat session.
- Notebook sidebar search across note title and note body.
- Sidebar result snippets that show the first relevant match when the search term is not in the default label.
- Keyword highlighting inside the visible sidebar text.
- Empty-result states for both tabs.
- Out of scope:
- Main content area highlighting.
- Persistent search history.
- Fuzzy search, tokenization, or ranking beyond existing sort order.

## Approach Options
1. Keep all search logic inline in `App.tsx`.
- Pros: few files changed.
- Cons: harder to test, mixes search logic with rendering and menu state.

2. Extract sidebar search helpers and keep `App.tsx` as wiring.
- Pros: testable, reusable, easier to evolve snippet and highlight rules.
- Cons: one extra module and test file.

3. Push search metadata into Redux slices.
- Pros: centralizes derived data.
- Cons: unnecessary state complexity for local UI-only filtering.

## Recommendation
Choose option 2. Search state remains local to `App.tsx`, while matching, snippet generation, and highlight segmentation live in a dedicated helper module with focused unit tests.

## Data Flow
1. `App.tsx` tracks separate search terms for AI and Notebook sidebars.
2. A helper module derives result items from sessions and notes:
- match by case-insensitive substring.
- prefer title match for notes.
- otherwise generate a snippet around the first body/message hit.
3. `App.tsx` renders the derived label segments and highlights matching ranges.
4. Existing sort order and selection behavior remain unchanged.

## Matching Rules
- Case-insensitive substring search.
- No fuzzy matching or token splitting.
- Empty query returns the current default labels:
- AI: first user message summary fallback.
- Notebook: note title.
- AI search traverses every message in the session until the first hit is found.
- Notebook search checks title first, then content.

## Snippet Rules
- If the default visible label already contains the hit, keep it and highlight inside it.
- Otherwise show a compact snippet around the first hit.
- Add leading and trailing `...` when the snippet is trimmed.
- Prefer human-readable whitespace normalization over preserving exact line breaks.

## Error Handling
- Empty or whitespace-only query behaves as no search.
- Sessions without messages still show `New chat`.
- Notes without title fall back to existing title data without special handling.

## Testing Strategy
- Unit tests for the helper module:
- AI match in first user message.
- AI match in later message and snippet generation.
- Notebook title match takes precedence over body.
- No match returns exclusion.
- Empty query falls back to default labels with no highlights.

## Risks And Mitigations
- Risk: snippet logic can become brittle if kept inside JSX.
- Mitigation: isolate it in pure helper functions with targeted tests.
- Risk: full-text search may feel inconsistent if result labels do not explain the hit.
- Mitigation: use hit-centered snippets whenever the default label misses the match.
