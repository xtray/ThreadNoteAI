import { describe, expect, it } from 'vitest';
import { resolveAnchorOccurrenceFromSelection } from './selectionAnchorOccurrence';

describe('resolveAnchorOccurrenceFromSelection', () => {
    it('returns the exact duplicate occurrence index for the current selection', () => {
        const fullText = 'alpha beta alpha gamma';
        const secondStart = fullText.indexOf('alpha', 1);

        const occurrence = resolveAnchorOccurrenceFromSelection({
            fullText,
            anchorText: 'alpha',
            selectionStart: secondStart,
        });

        expect(occurrence).toBe(1);
    });
});
