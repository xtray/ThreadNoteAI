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

describe('MessageContent math rendering', () => {
    it.each([
        ['$x^2$', false],
        ['$$\nx^2\n$$', true],
        [String.raw`\(x^2\)`, false],
        [String.raw`\[x^2\]`, true],
    ])('renders %s as math', (content, display) => {
        const html = renderToStaticMarkup(<MessageContent content={content} />);
        expect(html).toContain('class="katex"');
        expect(html.includes('katex-display')).toBe(display);
        expect(html).toContain('<math');
    });

    it('keeps math delimiters inside code literal', () => {
        const html = renderToStaticMarkup(<MessageContent content={'`$x$`\n\n```tex\n\\[x^2\\]\n```'} enableCodeBlockCopy />);
        expect(html).not.toContain('class="katex"');
        expect(html).toContain('\\[x^2\\]');
        expect(html).toContain('code-block-copy-btn');
    });

    it.each(['$$\nx^2', String.raw`\[x^2`, String.raw`\(x^2`, '$x^2'])('keeps unfinished %s as text', content => {
        expect(renderToStaticMarkup(<MessageContent content={content} />)).not.toContain('class="katex"');
    });

    it('does not throw on invalid TeX', () => {
        const html = renderToStaticMarkup(<MessageContent content={String.raw`$\frac{1}{$`} />);
        expect(html).toContain('katex-error');
    });

    it('keeps rendered math intact when searching surrounding text', () => {
        const html = renderToStaticMarkup(<MessageContent content={'Example $x^2$'} searchQuery="x" />);
        expect(html).toContain('class="katex"');
        expect(html).toContain('search-highlight');
        expect(html).not.toMatch(/<annotation[^>]*>[^<]*<mark/);
    });
});

describe('math and Markdown boundaries', () => {
    it('preserves indented code, multi-backtick code, and escaped dollar signs', () => {
        const content = '    \\[x^2\\]\n\n``\\(x^2\\)``\n\n\\$5 and \\$10';
        const html = renderToStaticMarkup(<MessageContent content={content} />);
        expect(html).not.toContain('class="katex"');
        expect(html).toContain('\\[x^2\\]');
        expect(html).toContain('\\(x^2\\)');
        expect(html).toContain('$5 and $10');
    });

    it('renders formulas on both sides of literal code', () => {
        const html = renderToStaticMarkup(<MessageContent content={String.raw`\(a\) and ` + '`$literal$`' + String.raw` and \[b\]`} />);
        expect(html.match(/class="katex"/g)).toHaveLength(2);
        expect(html).toContain('$literal$');
    });

    it('renders a display formula only after its streaming closing delimiter arrives', () => {
        const partial = '$$\n\\frac{a}{b}';
        expect(renderToStaticMarkup(<MessageContent content={partial} />)).not.toContain('class="katex"');
        expect(renderToStaticMarkup(<MessageContent content={partial + '\n$$'} />)).toContain('katex-display');
    });
});

describe('math container structure', () => {
    it('keeps display formulas inside one list', () => {
        const html = renderToStaticMarkup(<MessageContent content={String.raw`- First \[x^2\]` + '\n- Second'} />);
        expect(html.match(/<ul/g)).toHaveLength(1);
        expect(html).toMatch(/<li[^>]*>First <span class="katex-display">/);
    });
    it('keeps display formulas inside blockquotes', () => {
        const html = renderToStaticMarkup(<MessageContent content={String.raw`> \[x^2\]`} />);
        expect(html).toMatch(/<blockquote[^>]*>\s*<p[^>]*><span class="katex-display">/);
    });
    it.each([String.raw`\(x^2`, String.raw`\[x^2`])('preserves literal unfinished %s', content => {
        expect(renderToStaticMarkup(<MessageContent content={content} />)).toContain(content);
    });
});

describe('multiline TeX semantics', () => {
    it('preserves TeX comment line boundaries', () => {
        const html = renderToStaticMarkup(<MessageContent content={'$$\nx % comment\n+ y\n$$'} />);
        expect(html).toContain('<mi>x</mi>');
        expect(html).toContain('<mi>y</mi>');
    });
    it('excludes Markdown quote prefixes from multiline formulas', () => {
        const html = renderToStaticMarkup(<MessageContent content={'> \\[\n> x^2\n> \\]'} />);
        expect(html).toContain('katex-display');
        expect(html).toContain('<mi>x</mi>');
        expect(html).not.toContain('<mo>&gt;</mo>');
        expect(html).not.toContain('<mo>&gt;');
    });
});
