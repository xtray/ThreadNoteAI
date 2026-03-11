import { describe, expect, it } from 'vitest';
import {
    buildSelectionHighlightRects,
    shouldIgnoreSubSessionMouseUpStateReset,
    shouldShowSubSessionOverlay,
} from './subSessionSelection';

describe('shouldShowSubSessionOverlay', () => {
    it('ignores mouseup events coming from the floating sub-session button itself', () => {
        expect(shouldShowSubSessionOverlay({
            hasLocalSelection: true,
            targetInsideAnnotation: false,
            targetInsideFloatingOverlay: false,
            targetInsideSubSessionButton: true,
        })).toBe(false);
    });

    it('allows sub-session selection even when mouseup happens inside an existing annotation', () => {
        expect(shouldShowSubSessionOverlay({
            hasLocalSelection: true,
            targetInsideAnnotation: true,
            targetInsideFloatingOverlay: false,
            targetInsideSubSessionButton: false,
        })).toBe(true);
    });

    it('ignores plain clicks on existing annotations when there is no text selection', () => {
        expect(shouldShowSubSessionOverlay({
            hasLocalSelection: false,
            targetInsideAnnotation: true,
            targetInsideFloatingOverlay: false,
            targetInsideSubSessionButton: false,
        })).toBe(false);
    });

    it('reports annotation clicks without selection as a no-op so follow-up click handlers can open the sub-session', () => {
        expect(shouldIgnoreSubSessionMouseUpStateReset({
            hasLocalSelection: false,
            targetInsideAnnotation: true,
            targetInsideFloatingOverlay: false,
            targetInsideSubSessionButton: false,
        })).toBe(true);
    });

    it('never shows the creation button for interactions inside the floating overlay', () => {
        expect(shouldShowSubSessionOverlay({
            hasLocalSelection: true,
            targetInsideAnnotation: false,
            targetInsideFloatingOverlay: true,
            targetInsideSubSessionButton: false,
        })).toBe(false);
    });

    it('builds stable highlight rects from browser selection client rects', () => {
        const rects = buildSelectionHighlightRects([
            { top: 10, left: 20, width: 80, height: 24 },
            { top: 36, left: 24, width: 0, height: 18 },
            { top: 62, left: 28, width: 56, height: 20 },
        ]);

        expect(rects).toEqual([
            { top: 10, left: 20, width: 80, height: 24 },
            { top: 62, left: 28, width: 56, height: 20 },
        ]);
    });
});
