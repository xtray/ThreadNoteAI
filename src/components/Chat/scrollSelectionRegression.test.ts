import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readComponentSource = (fileName: string) => (
    readFileSync(new URL(`./${fileName}`, import.meta.url), 'utf8')
);

const extractScrollHandlerBody = (source: string) => {
    const blockMatch = source.match(/const closeOnScroll = \(\) => \{([\s\S]*?)\n\s*\};/);
    if (blockMatch) {
        return blockMatch[1];
    }

    const inlineMatch = source.match(/const closeOnScroll = \(\) => ([^;]+);/);
    return inlineMatch?.[1] ?? null;
};

describe('scroll-driven text selection regression', () => {
    it('does not re-inject annotation markup on every parent commit after mouseup', () => {
        const source = readComponentSource('MessageContent.tsx');

        expect(source).not.toMatch(
            /useIsomorphicLayoutEffect\(\(\) => \{\s*removeInjectedHighlights\(\);\s*sortedAnnotations\.forEach\(injectHighlight\);\s*\}\);/s
        );
        expect(source).toMatch(
            /useIsomorphicLayoutEffect\(\(\) => \{\s*removeInjectedHighlights\(\);\s*sortedAnnotations\.forEach\(injectHighlight\);\s*\}, \[[^\]]+\]\);/s
        );
    });

    it('memoizes message content rendering so selection overlay state does not rerender the markdown subtree', () => {
        const source = readComponentSource('MessageContent.tsx');
        expect(source).toContain('export default React.memo(MessageContent);');
    });

    it('passes stable message-content callbacks from the main chat item', () => {
        const source = readComponentSource('MessageItem.tsx');
        expect(source).toContain('const handleOpenSession = useCallback(');
        expect(source).toContain('const handleDeleteSubSession = useCallback(');
    });

    it('relies on the browser native selection highlight in the main chat instead of rendering fixed highlight overlays', () => {
        const source = readComponentSource('MessageItem.tsx');

        expect(source).not.toContain('floating-selection-highlight');
        expect(source).not.toContain('selectionHighlightRects');
    });

    it('relies on the browser native selection highlight in sub-sessions instead of rendering fixed highlight overlays', () => {
        const source = readComponentSource('FloatingOverlay.tsx');

        expect(source).not.toContain('floating-selection-highlight');
        expect(source).not.toContain('selectionHighlightRects');
    });

    it('keeps native browser selection intact when the main chat message list scrolls', () => {
        const source = readComponentSource('MessageItem.tsx');
        const closeOnScrollBody = extractScrollHandlerBody(source);

        expect(closeOnScrollBody).toBeTruthy();
        expect(closeOnScrollBody).not.toContain('clearBrowserSelection');
        expect(closeOnScrollBody).not.toContain('clearSelectionOverlay');
    });

    it('keeps native browser selection intact when the sub-session overlay scrolls', () => {
        const source = readComponentSource('FloatingOverlay.tsx');
        const closeOnScrollBody = extractScrollHandlerBody(source);

        expect(closeOnScrollBody).toBeTruthy();
        expect(closeOnScrollBody).not.toContain('clearBrowserSelection');
        expect(closeOnScrollBody).not.toContain('clearSelectionOverlay');
    });
});
