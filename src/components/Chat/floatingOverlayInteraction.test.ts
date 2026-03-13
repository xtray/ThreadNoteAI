import { describe, expect, it } from 'vitest';
import { shouldPreserveSelectableReplyMouseDown } from './floatingOverlayInteraction';

const createTarget = (matches: string[] = []) => ({
    closest: (selector: string) => (matches.includes(selector) ? {} : null),
}) as HTMLElement;

describe('floatingOverlayInteraction', () => {
    it('preserves mousedown events inside selectable overlay replies so native word selection can complete', () => {
        const target = createTarget(['.overlay-message-selectable']);

        expect(shouldPreserveSelectableReplyMouseDown(target)).toBe(true);
    });

    it('preserves mousedown events for existing floating controls', () => {
        const target = createTarget(['.floating-subsession-btn']);

        expect(shouldPreserveSelectableReplyMouseDown(target)).toBe(true);
    });

    it('allows outside clicks to dismiss floating UI immediately', () => {
        const target = createTarget();

        expect(shouldPreserveSelectableReplyMouseDown(target)).toBe(false);
    });
});
