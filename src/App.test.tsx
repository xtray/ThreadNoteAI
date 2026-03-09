import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderSidebarLabel } from './App';
import type { SidebarResult } from './utils/sidebarSearch';

describe('renderSidebarLabel', () => {
    it('wraps plain sidebar text in a dedicated truncation container', () => {
        const result: SidebarResult = {
            label: 'First question about indexing',
            segments: [{ text: 'First question about indexing', matched: false }],
        };

        const html = renderToStaticMarkup(renderSidebarLabel('session-1', result));

        expect(html).toContain('class="history-item-label"');
        expect(html).toContain('First question about indexing');
    });

    it('keeps highlight segments inside the truncation container', () => {
        const result: SidebarResult = {
            label: '...rollback safety...',
            segments: [
                { text: '...', matched: false },
                { text: 'rollback', matched: true },
                { text: ' safety...', matched: false },
            ],
        };

        const html = renderToStaticMarkup(renderSidebarLabel('note-1', result));

        expect(html).toContain('class="history-item-label"');
        expect(html).toContain('class="history-item-highlight"');
        expect(html).toContain('<span class="history-item-label">');
    });
});
