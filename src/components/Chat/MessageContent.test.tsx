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

    it('renders translated code copy text when language is zh', () => {
        const html = renderToStaticMarkup(
            <MessageContent
                content={'```ts\nconst x = 1;\n```'}
                enableCodeBlockCopy
                language="zh"
            />
        );

        expect(html).toContain('复制');
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

    it('renders search highlights from props without relying on dom mutation', () => {
        const html = renderToStaticMarkup(
            <MessageContent
                content={'Alpha beta alphabet'}
                searchQuery="al"
            />
        );

        expect(html).toContain('search-highlight');
        expect(html).toContain('<mark');
    });
});
