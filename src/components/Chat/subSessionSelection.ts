export type SelectionOverlayDecision = {
    hasLocalSelection: boolean;
    targetInsideAnnotation: boolean;
    targetInsideFloatingOverlay: boolean;
    targetInsideSubSessionButton?: boolean;
};

export type SelectionHighlightRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export const shouldShowSubSessionOverlay = ({
    hasLocalSelection,
    targetInsideAnnotation,
    targetInsideFloatingOverlay,
    targetInsideSubSessionButton = false,
}: SelectionOverlayDecision) => {
    if (targetInsideFloatingOverlay) {
        return false;
    }

    if (targetInsideSubSessionButton) {
        return false;
    }

    if (hasLocalSelection) {
        return true;
    }

    if (targetInsideAnnotation) {
        return false;
    }

    return false;
};

export const shouldIgnoreSubSessionMouseUpStateReset = ({
    hasLocalSelection,
    targetInsideAnnotation,
    targetInsideFloatingOverlay,
    targetInsideSubSessionButton = false,
}: SelectionOverlayDecision) => {
    if (targetInsideFloatingOverlay || targetInsideSubSessionButton) {
        return false;
    }

    return targetInsideAnnotation && !hasLocalSelection;
};

export const buildSelectionHighlightRects = (
    rects: Array<Pick<SelectionHighlightRect, 'top' | 'left' | 'width' | 'height'>>
): SelectionHighlightRect[] => rects
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    }));
