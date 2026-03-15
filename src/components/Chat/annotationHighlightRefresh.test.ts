import { describe, expect, it } from 'vitest';
import {
    buildAnnotationHighlightRefreshKey,
    shouldRefreshAnnotationHighlights,
} from './annotationHighlightRefresh';

describe('annotationHighlightRefresh', () => {
    it('keeps the same refresh key for identical markdown-highlight inputs', () => {
        const args = {
            mainContent: 'Alpha Beta',
            normalizedSearchQuery: '',
            annotations: [
                {
                    id: 'anno-1',
                    subSessionId: 'sub-1',
                    anchorText: 'Alpha',
                    createdAt: 1,
                },
            ],
            thinkExpanded: false,
            copiedCodeBlockId: null,
            enableCodeBlockCopy: true,
        };

        expect(buildAnnotationHighlightRefreshKey(args)).toBe(buildAnnotationHighlightRefreshKey(args));
    });

    it('changes the refresh key when markdown subtree inputs change', () => {
        const baseKey = buildAnnotationHighlightRefreshKey({
            mainContent: 'Alpha Beta',
            normalizedSearchQuery: '',
            annotations: [],
            thinkExpanded: false,
            copiedCodeBlockId: null,
            enableCodeBlockCopy: true,
        });

        const copiedKey = buildAnnotationHighlightRefreshKey({
            mainContent: 'Alpha Beta',
            normalizedSearchQuery: '',
            annotations: [],
            thinkExpanded: false,
            copiedCodeBlockId: 'code-block-1',
            enableCodeBlockCopy: true,
        });

        expect(copiedKey).not.toBe(baseKey);
    });

    it('skips re-injection when the root node and refresh key are unchanged', () => {
        const root = {};

        expect(shouldRefreshAnnotationHighlights({
            currentRoot: root,
            previousRoot: root,
            currentKey: 'same',
            previousKey: 'same',
        })).toBe(false);
    });

    it('re-injects when either the rendered root or refresh key changes', () => {
        const previousRoot = {};
        const currentRoot = {};

        expect(shouldRefreshAnnotationHighlights({
            currentRoot,
            previousRoot,
            currentKey: 'same',
            previousKey: 'same',
        })).toBe(true);

        expect(shouldRefreshAnnotationHighlights({
            currentRoot: previousRoot,
            previousRoot,
            currentKey: 'next',
            previousKey: 'prev',
        })).toBe(true);
    });
});
