export const SIDEBAR_WIDTH_STORAGE_KEY = 'threadnote_sidebar_width';
export const DEFAULT_SIDEBAR_WIDTH = 260;
export const MIN_SIDEBAR_WIDTH = 220;
export const MAX_SIDEBAR_WIDTH = 560;
export const MIN_MAIN_WORKSPACE_WIDTH = 440;

const toFiniteNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
};

export const clampSidebarWidth = (width: number, viewportWidth: number) => {
    const numericWidth = toFiniteNumber(width);
    const numericViewportWidth = toFiniteNumber(viewportWidth);
    if (numericWidth === null || numericViewportWidth === null) {
        return DEFAULT_SIDEBAR_WIDTH;
    }

    const viewportMaxWidth = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(MAX_SIDEBAR_WIDTH, Math.floor(numericViewportWidth - MIN_MAIN_WORKSPACE_WIDTH))
    );

    return Math.min(viewportMaxWidth, Math.max(MIN_SIDEBAR_WIDTH, Math.round(numericWidth)));
};

export const loadSidebarWidth = (storage: Pick<Storage, 'getItem'>, viewportWidth: number) => {
    const fallbackWidth = clampSidebarWidth(DEFAULT_SIDEBAR_WIDTH, viewportWidth);
    try {
        const rawValue = storage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        if (rawValue === null) return fallbackWidth;
        const parsed = toFiniteNumber(rawValue);
        if (parsed === null) return fallbackWidth;
        return clampSidebarWidth(parsed, viewportWidth);
    } catch {
        return fallbackWidth;
    }
};

export const saveSidebarWidth = (storage: Pick<Storage, 'setItem'>, width: number, viewportWidth: number) => {
    try {
        storage.setItem(
            SIDEBAR_WIDTH_STORAGE_KEY,
            String(clampSidebarWidth(width, viewportWidth))
        );
    } catch {
        // Ignore storage failures so resizing still works in-memory.
    }
};
