import { describe, expect, it, vi } from 'vitest';
import {
    findAnnotationTextMatch,
    getAnchorOccurrenceIndex,
    getSegmentHighlightRanges,
    safelySurroundRangeContents,
} from './annotationHighlight';

describe('getAnchorOccurrenceIndex', () => {
    it('counts matching anchor text before the current selection', () => {
        expect(getAnchorOccurrenceIndex('SONiC 官方文档: ', 'SONiC')).toBe(1);
    });
});

describe('findAnnotationTextMatch', () => {
    it('uses the stored occurrence index to restore repeated annotation text after reload', () => {
        expect(findAnnotationTextMatch('SONiC source: SONiC docs', 'SONiC', 1)).toEqual({
            start: 14,
            length: 5,
        });
    });

    it('falls back to the first occurrence for older annotations without occurrence metadata', () => {
        expect(findAnnotationTextMatch('SONiC source: SONiC docs', 'SONiC')).toEqual({
            start: 0,
            length: 5,
        });
    });
});

describe('getSegmentHighlightRanges', () => {
    it('splits a matched annotation across text nodes so each piece can be highlighted', () => {
        const nodeA = { textContent: 'Is there ' } as Text;
        const nodeB = { textContent: 'something' } as Text;
        const nodeC = { textContent: ' else' } as Text;

        expect(getSegmentHighlightRanges([
            { node: nodeA, start: 0, end: 9 },
            { node: nodeB, start: 9, end: 18 },
            { node: nodeC, start: 18, end: 23 },
        ], 6, 22)).toEqual([
            { node: nodeA, startOffset: 6, endOffset: 9 },
            { node: nodeB, startOffset: 0, endOffset: 9 },
            { node: nodeC, startOffset: 0, endOffset: 4 },
        ]);
    });
});

describe('safelySurroundRangeContents', () => {
    it('returns false instead of throwing when a cross-structure range cannot be wrapped', () => {
        const range = {
            surroundContents: vi.fn(() => {
                throw new Error('partial non-text node');
            }),
            extractContents: vi.fn(() => {
                throw new Error('hierarchy error');
            }),
            insertNode: vi.fn(),
        } as unknown as Range;
        const wrapper = {
            appendChild: vi.fn(),
        } as unknown as HTMLElement;

        expect(safelySurroundRangeContents(range, wrapper)).toBe(false);
    });

    it('uses the extract fallback when surroundContents rejects', () => {
        const fragment = {} as DocumentFragment;
        const range = {
            surroundContents: vi.fn(() => {
                throw new Error('partial non-text node');
            }),
            extractContents: vi.fn(() => fragment),
            insertNode: vi.fn(),
        } as unknown as Range;
        const wrapper = {
            appendChild: vi.fn(),
        } as unknown as HTMLElement;

        expect(safelySurroundRangeContents(range, wrapper)).toBe(true);
        expect(wrapper.appendChild).toHaveBeenCalledWith(fragment);
        expect(range.insertNode).toHaveBeenCalledWith(wrapper);
    });
});
