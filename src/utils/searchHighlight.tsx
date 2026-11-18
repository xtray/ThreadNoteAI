import React from 'react';
import { normalizeSearchQuery } from './sidebarSearch';

const SKIPPED_TAGS = new Set(['button', 'textarea', 'input', 'script', 'style']);

const highlightText = (text: string, normalizedQuery: string, keyPrefix: string): React.ReactNode => {
    if (!normalizedQuery) {
        return text;
    }

    const lowerText = text.toLowerCase();
    if (!lowerText.includes(normalizedQuery)) {
        return text;
    }

    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let partIndex = 0;

    while (cursor < text.length) {
        const matchIndex = lowerText.indexOf(normalizedQuery, cursor);
        if (matchIndex === -1) {
            nodes.push(text.slice(cursor));
            break;
        }

        if (matchIndex > cursor) {
            nodes.push(text.slice(cursor, matchIndex));
        }

        nodes.push(
            <mark
                key={`${keyPrefix}-${partIndex}`}
                className="search-highlight"
                data-search-hit="true"
            >
                {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
            </mark>
        );
        cursor = matchIndex + normalizedQuery.length;
        partIndex += 1;
    }

    return nodes;
};

const transformNode = (node: React.ReactNode, normalizedQuery: string, keyPrefix: string): React.ReactNode => {
    if (typeof node === 'string' || typeof node === 'number') {
        return highlightText(String(node), normalizedQuery, keyPrefix);
    }

    if (Array.isArray(node)) {
        return node.map((child, index) => transformNode(child, normalizedQuery, `${keyPrefix}-${index}`));
    }

    if (!React.isValidElement(node)) {
        return node;
    }

    const tagName = typeof node.type === 'string' ? node.type : null;
    if (tagName && SKIPPED_TAGS.has(tagName)) {
        return node;
    }

    const props = node.props as { children?: React.ReactNode; className?: string };
    if (props.className?.split(/\s+/).some(name => name === 'katex' || name === 'katex-display')) {
        return node;
    }
    if (props.children === undefined) {
        return node;
    }

    return React.cloneElement(
        node,
        undefined,
        transformNode(props.children, normalizedQuery, keyPrefix)
    );
};

export const highlightReactNode = (node: React.ReactNode, query: string, keyPrefix = 'search'): React.ReactNode => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return node;
    }
    return transformNode(node, normalizedQuery, keyPrefix);
};

export const renderWithSearchHighlight = (
    tag: keyof JSX.IntrinsicElements,
    children: React.ReactNode,
    props: Record<string, unknown> | undefined,
    query: string,
    keyPrefix: string,
) => React.createElement(tag, props, highlightReactNode(children, query, keyPrefix));
