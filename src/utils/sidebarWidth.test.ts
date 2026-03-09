import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_SIDEBAR_WIDTH,
    MIN_SIDEBAR_WIDTH,
    clampSidebarWidth,
    loadSidebarWidth,
} from './sidebarWidth';

type StorageReader = Pick<Storage, 'getItem'>;

const storage = (() => {
    const values = new Map<string, string>();
    return {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
            values.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            values.delete(key);
        }),
        clear: () => values.clear(),
    };
})();

describe('sidebarWidth helpers', () => {
    afterEach(() => {
        storage.clear();
        vi.restoreAllMocks();
    });

    it('loads the default width when storage is empty', () => {
        expect(loadSidebarWidth(storage as StorageReader, 1200)).toBe(DEFAULT_SIDEBAR_WIDTH);
    });

    it('clamps the default width when the viewport is narrow', () => {
        expect(loadSidebarWidth(storage as StorageReader, 500)).toBe(MIN_SIDEBAR_WIDTH);
    });

    it('falls back to the default width when the stored value is invalid', () => {
        storage.setItem('threadnote_sidebar_width', 'not-a-number');

        expect(loadSidebarWidth(storage as StorageReader, 1200)).toBe(DEFAULT_SIDEBAR_WIDTH);
    });

    it('clamps widths below the minimum', () => {
        expect(clampSidebarWidth(MIN_SIDEBAR_WIDTH - 80, 1200)).toBe(MIN_SIDEBAR_WIDTH);
    });

    it('clamps widths above the viewport-based maximum', () => {
        expect(clampSidebarWidth(900, 1000)).toBe(560);
    });
});
