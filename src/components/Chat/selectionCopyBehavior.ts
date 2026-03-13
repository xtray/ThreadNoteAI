export const MAIN_SELECTION_COPY_DISMISS_DELAY_MS = 500;
export const OVERLAY_SELECTION_COPY_DISMISS_DELAY_MS = MAIN_SELECTION_COPY_DISMISS_DELAY_MS;

export const getSelectionCopyDismissDelay = (scope: 'main-message' | 'floating-overlay') => (
    scope === 'floating-overlay'
        ? OVERLAY_SELECTION_COPY_DISMISS_DELAY_MS
        : MAIN_SELECTION_COPY_DISMISS_DELAY_MS
);

export const shouldDismissSelectionBeforeCopy = (scope: 'main-message' | 'floating-overlay') => (
    false
);
