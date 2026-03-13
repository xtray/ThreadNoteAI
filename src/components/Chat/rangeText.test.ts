import { describe, expect, it } from 'vitest';
import { getTrimmedRangeText } from './rangeText';

describe('rangeText', () => {
    it('uses the range text as the single source of truth for selection content', () => {
        expect(getTrimmedRangeText({
            toString: () => '  first line\nsecond line  ',
        })).toBe('first line\nsecond line');
    });

    it('returns an empty string when no range exists', () => {
        expect(getTrimmedRangeText(null)).toBe('');
        expect(getTrimmedRangeText(undefined)).toBe('');
    });
});
