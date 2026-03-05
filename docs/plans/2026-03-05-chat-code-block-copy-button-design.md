# Chat Code Block Copy Button Design

**User Intent:** In AI chat responses, when output contains Markdown code blocks, show a copy button in the bottom-right corner of each code block so users can quickly copy code, similar to ChatGPT.

## Scope
- In scope:
- Assistant message markdown fenced code blocks (`pre > code`) in chat window.
- Button placement at code block bottom-right.
- Copy the exact code block text.
- Success feedback (`Copied`) with auto-reset.
- Out of scope:
- Inline code copy.
- User message bubble copy button.
- Global clipboard/history changes.

## Approach Options
1. Add a generic floating copy button on every `pre` via DOM post-processing.
- Pros: no markdown renderer customization.
- Cons: brittle with re-render/selection/highlight injections.

2. Use `react-markdown` custom `code` renderer to wrap non-inline code blocks.
- Pros: explicit, deterministic, React-native state/event handling.
- Cons: requires a small renderer extension and style updates.

3. Add one toolbar action per whole assistant turn (already exists).
- Pros: minimal change.
- Cons: does not satisfy per-code-block copy behavior.

## Recommendation
Choose option 2. Extend `MessageContent` markdown renderers so only block code is wrapped with a copy button, and gate the feature by prop (`enableCodeBlockCopy`) from `MessageItem` for assistant messages only.

## Data Flow
1. `MessageItem` passes `enableCodeBlockCopy={message.role === 'assistant'}` to `MessageContent`.
2. `MessageContent` custom `code` renderer:
- Inline code: render unchanged.
- Block code: render wrapper + `pre/code` + copy button.
3. Button click calls shared clipboard utility `copyTextToClipboard`.
4. On success, local state marks current block copied and resets after timeout.

## Error Handling
- Clipboard write failure: keep UI unchanged (`Copy`), no throw.
- Empty code text: no-op (defensive).

## Testing Strategy
- Unit-style rendering tests with `react-dom/server`:
- block code shows copy button when enabled.
- inline code does not show copy button.
- feature disabled does not render copy button.

## Risks and Mitigations
- Risk: interaction conflicts with existing context menu/highlight clicks.
- Mitigation: stop propagation on button mouse down/click.
- Risk: layout overlap on narrow widths.
- Mitigation: reserve button space via `pre` bottom padding.
