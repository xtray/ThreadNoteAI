import { describe, expect, it, vi } from 'vitest';
import { clearBrowserSelection } from './browserSelection';

describe('browserSelection', () => {
    it('clears an active browser selection', () => {
        const removeAllRanges = vi.fn();

        expect(clearBrowserSelection({ removeAllRanges })).toBe(true);
        expect(removeAllRanges).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no browser selection is available', () => {
        expect(clearBrowserSelection(null)).toBe(false);
        expect(clearBrowserSelection(undefined)).toBe(false);
    });
});
