export type ViewportRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export type OverlayRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

type OverlayPoint = {
    top: number;
    left: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const translateViewportRectsToOverlay = (
    rects: ViewportRect[],
    overlayRect: OverlayRect
): ViewportRect[] => rects.map((rect) => ({
    top: rect.top - overlayRect.top,
    left: rect.left - overlayRect.left,
    width: rect.width,
    height: rect.height,
}));

export const calculateOverlaySelectionActionPosition = (
    selectionRect: ViewportRect,
    overlayRect: OverlayRect,
    verticalOffset = 36,
    horizontalMargin = 24
): OverlayPoint => {
    const minLeft = horizontalMargin;
    const maxLeft = Math.max(horizontalMargin, overlayRect.width - horizontalMargin);
    const centeredLeft = selectionRect.left - overlayRect.left + (selectionRect.width / 2);

    return {
        top: Math.max(horizontalMargin / 2, selectionRect.top - overlayRect.top - verticalOffset),
        left: clamp(centeredLeft, minLeft, maxLeft),
    };
};
