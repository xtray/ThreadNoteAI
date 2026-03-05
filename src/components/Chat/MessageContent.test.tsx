import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MessageContent from './MessageContent';

describe('MessageContent code block copy button', () => {
    it('renders copy button for fenced code blocks when enabled', () => {
        const html = renderToStaticMarkup(
            <MessageContent
                content={'```ts\nconst x = 1;\n```'}
                enableCodeBlockCopy
            />
        );

        expect(html).toContain('code-block-copy-btn');
        expect(html).toContain('Copy');
    });

    it('does not render copy button for inline code', () => {
        const html = renderToStaticMarkup(
            <MessageContent
                content={'Use `const x = 1` inline.'}
                enableCodeBlockCopy
            />
        );

        expect(html).not.toContain('code-block-copy-btn');
    });

    it('does not render copy button when feature is disabled', () => {
        const html = renderToStaticMarkup(
            <MessageContent
                content={'```js\nconsole.log(\"hi\")\n```'}
                enableCodeBlockCopy={false}
            />
        );

        expect(html).not.toContain('code-block-copy-btn');
    });
});
