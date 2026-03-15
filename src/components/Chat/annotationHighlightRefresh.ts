import type { MessageAnnotation } from '../../store/slices/sessionSlice';

type BuildAnnotationHighlightRefreshKeyArgs = {
    mainContent: string;
    normalizedSearchQuery: string;
    annotations: MessageAnnotation[];
    thinkExpanded: boolean;
    copiedCodeBlockId: string | null;
    enableCodeBlockCopy: boolean;
};

type ShouldRefreshAnnotationHighlightsArgs = {
    currentRoot: object | null;
    previousRoot: object | null;
    currentKey: string;
    previousKey: string | null;
};

export const buildAnnotationHighlightRefreshKey = ({
    mainContent,
    normalizedSearchQuery,
    annotations,
    thinkExpanded,
    copiedCodeBlockId,
    enableCodeBlockCopy,
}: BuildAnnotationHighlightRefreshKeyArgs) => JSON.stringify({
    mainContent,
    normalizedSearchQuery,
    annotations: annotations.map((annotation) => ({
        id: annotation.id,
        subSessionId: annotation.subSessionId,
        anchorText: annotation.anchorText,
        anchorOccurrence: annotation.anchorOccurrence ?? null,
        createdAt: annotation.createdAt,
    })),
    thinkExpanded,
    copiedCodeBlockId,
    enableCodeBlockCopy,
});

export const shouldRefreshAnnotationHighlights = ({
    currentRoot,
    previousRoot,
    currentKey,
    previousKey,
}: ShouldRefreshAnnotationHighlightsArgs) => {
    if (!currentRoot) return false;
    if (currentRoot !== previousRoot) return true;
    return currentKey !== previousKey;
};
