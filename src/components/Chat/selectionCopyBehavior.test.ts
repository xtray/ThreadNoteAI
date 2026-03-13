import { describe, expect, it } from 'vitest';
import {
    getSelectionCopyDismissDelay,
    MAIN_SELECTION_COPY_DISMISS_DELAY_MS,
    OVERLAY_SELECTION_COPY_DISMISS_DELAY_MS,
    shouldDismissSelectionBeforeCopy,
} from './selectionCopyBehavior';

describe('selectionCopyBehavior', () => {
    it('keeps copied feedback delay in the main chat selection menu', () => {
        expect(getSelectionCopyDismissDelay('main-message')).toBe(500);
    });

    it('dismisses the overlay selection menu immediately after copy', () => {
        expect(getSelectionCopyDismissDelay('floating-overlay')).toBe(OVERLAY_SELECTION_COPY_DISMISS_DELAY_MS);
        expect(getSelectionCopyDismissDelay('floating-overlay')).toBe(500);
    });

    it('keeps floating-overlay selection UI visible until copied feedback finishes', () => {
        expect(shouldDismissSelectionBeforeCopy('floating-overlay')).toBe(false);
        expect(shouldDismissSelectionBeforeCopy('main-message')).toBe(false);
    });
});
