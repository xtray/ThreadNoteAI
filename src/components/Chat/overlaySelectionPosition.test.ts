import { describe, expect, it } from 'vitest';
import {
    calculateOverlaySelectionActionPosition,
    translateViewportRectsToOverlay,
} from './overlaySelectionPosition';

describe('overlaySelectionPosition', () => {
    it('translates viewport rects into overlay-local coordinates', () => {
        const rects = translateViewportRectsToOverlay([
            { top: 320, left: 1460, width: 88, height: 20 },
            { top: 344, left: 1492, width: 64, height: 20 },
        ], {
            top: 80,
            left: 1320,
            width: 420,
            height: 640,
        });

        expect(rects).toEqual([
            { top: 240, left: 140, width: 88, height: 20 },
            { top: 264, left: 172, width: 64, height: 20 },
        ]);
    });

    it('computes a floating action position relative to the overlay instead of the viewport', () => {
        const position = calculateOverlaySelectionActionPosition({
            top: 320,
            left: 1460,
            width: 88,
            height: 20,
        }, {
            top: 80,
            left: 1320,
            width: 420,
            height: 640,
        });

        expect(position).toEqual({
            top: 204,
            left: 184,
        });
    });

    it('clamps the floating action position so it stays inside a narrow overlay', () => {
        const position = calculateOverlaySelectionActionPosition({
            top: 110,
            left: 1180,
            width: 18,
            height: 20,
        }, {
            top: 80,
            left: 1100,
            width: 100,
            height: 400,
        });

        expect(position).toEqual({
            top: 12,
            left: 76,
        });
    });
});
