import { describe, expect, it } from 'vitest';
import { findAnnotationMatch } from './annotationMatch';

describe('findAnnotationMatch', () => {
    it('uses the selected occurrence when anchorOccurrence is provided', () => {
        const fullText = 'alpha beta alpha gamma';
        const match = findAnnotationMatch({
            fullText,
            anchorText: 'alpha',
            anchorOccurrence: 1,
        });

        expect(match).toEqual({
            start: 11,
            length: 5,
        });
    });
});
