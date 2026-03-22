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

    it('renders translated settings trigger text in chinese', () => {
        const html = renderToStaticMarkup(
            <SidebarTitleBar onOpenSettings={vi.fn()} language="zh" />
        );

        expect(html).toContain('打开全局设置');
    });
});
