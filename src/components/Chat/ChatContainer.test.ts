import { describe, expect, it } from 'vitest';
import { orderModelOptionsBySelection } from './ChatContainer';

describe('orderModelOptionsBySelection', () => {
    it('puts selected models first and keeps remaining models in original order', () => {
        const options = [
            { id: 'm1', displayName: 'Model 1' },
            { id: 'm2', displayName: 'Model 2' },
            { id: 'm3', displayName: 'Model 3' },
            { id: 'm4', displayName: 'Model 4' },
        ];

        const ordered = orderModelOptionsBySelection(options, ['m3', 'm1']);

        expect(ordered.map((item) => item.id)).toEqual(['m3', 'm1', 'm2', 'm4']);
    });

    it('ignores unknown selected ids and keeps uniqueness', () => {
        const options = [
            { id: 'm1', displayName: 'Model 1' },
            { id: 'm2', displayName: 'Model 2' },
            { id: 'm3', displayName: 'Model 3' },
        ];

        const ordered = orderModelOptionsBySelection(options, ['mX', 'm2', 'm2']);

        expect(ordered.map((item) => item.id)).toEqual(['m2', 'm1', 'm3']);
    });
});
