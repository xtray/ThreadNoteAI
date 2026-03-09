import { describe, expect, it, vi } from 'vitest';
import { guardCtrlWheelZoom } from './wheelZoomGuard';

describe('guardCtrlWheelZoom', () => {
    it('prevents default when ctrl+wheel is used', () => {
        const preventDefault = vi.fn();

        const blocked = guardCtrlWheelZoom({
            ctrlKey: true,
            preventDefault,
        });

        expect(blocked).toBe(true);
        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('ignores regular wheel scrolling', () => {
        const preventDefault = vi.fn();

        const blocked = guardCtrlWheelZoom({
            ctrlKey: false,
            preventDefault,
        });

        expect(blocked).toBe(false);
        expect(preventDefault).not.toHaveBeenCalled();
    });
});
