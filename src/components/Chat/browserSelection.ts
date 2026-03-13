export type SelectionLike = {
    removeAllRanges: () => void;
};

export const clearBrowserSelection = (selection: SelectionLike | null | undefined) => {
    if (!selection) return false;
    selection.removeAllRanges();
    return true;
};
