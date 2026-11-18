import { unified } from 'unified';
import remarkParse from 'remark-parse';

const parser = unified().use(remarkParse);

type MarkdownNode = {
    type: string;
    position?: { start: { offset?: number }; end: { offset?: number } };
    children?: MarkdownNode[];
    data?: { hProperties?: Record<string, unknown> };
};

const normalizeText = (text: string): string => {
    let result = '';
    for (let i = 0; i < text.length;) {
        const bracket = text.startsWith('\\(', i) ? ')' : text.startsWith('\\[', i) ? ']' : null;
        const display = text.startsWith('$$', i);
        if (bracket || display) {
            const closing = bracket ? '\\' + bracket : '$$';
            let end = text.indexOf(closing, i + 2);
            while (end >= 0 && text[end - 1] === '\\') end = text.indexOf(closing, end + closing.length);
            if (end >= 0) {
                const body = text.slice(i + 2, end);
                result += bracket === ')' ? '$' + body + '$' : '$$' + body + '$$';
                i = end + 2;
                continue;
            }
            if (bracket) {
                result += '\\' + text.slice(i, i + 2);
                i += 2;
                continue;
            }
            // remark-math accepts unclosed display blocks; keep streamed fragments literal.
            if (display) {
                result += '\\$\\$';
                i += 2;
                continue;
            }
        }
        if (text[i] === '\\' && i + 1 < text.length) {
            result += text.slice(i, i + 2);
            i += 2;
        } else {
            result += text[i++];
        }
    }
    return result;
};

/** Normalize model-produced delimiters without changing Markdown code or stored text. */
export const prepareMathMarkdown = (content: string): string => {
    const ranges: Array<[number, number]> = [];
    const visit = (node: MarkdownNode) => {
        if (node.type === 'code' || node.type === 'inlineCode') {
            const start = node.position?.start.offset;
            const end = node.position?.end.offset;
            if (start !== undefined && end !== undefined) ranges.push([start, end]);
            return;
        }
        node.children?.forEach(visit);
    };
    visit(parser.parse(content));
    let cursor = 0;
    let result = '';
    for (const [start, end] of ranges) {
        result += normalizeText(content.slice(cursor, start)) + content.slice(start, end);
        cursor = end;
    }
    return result + normalizeText(content.slice(cursor));
};

/** Mark double-dollar inline nodes as display math without inserting container-breaking newlines. */
export const remarkDisplayMath = () => (tree: MarkdownNode, file: { value: unknown }) => {
    const source = String(file.value);
    const visit = (node: MarkdownNode) => {
        const offset = node.position?.start.offset;
        if (node.type === 'inlineMath' && offset !== undefined && source.startsWith('$$', offset)) {
            node.data = {
                ...node.data,
                hProperties: { ...node.data?.hProperties, className: ['language-math', 'math-display'] },
            };
        }
        node.children?.forEach(visit);
    };
    visit(tree);
};
