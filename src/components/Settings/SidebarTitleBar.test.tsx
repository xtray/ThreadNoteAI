import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SidebarTitleBar from './SidebarTitleBar';

describe('SidebarTitleBar', () => {
    it('renders the app title and global settings trigger', () => {
        const html = renderToStaticMarkup(
            <SidebarTitleBar onOpenSettings={vi.fn()} />
        );

        expect(html).toContain('ThreadNote AI');
        expect(html).toContain('Open global settings');
        expect(html).toContain('sidebar-title-actions');
    });
});
