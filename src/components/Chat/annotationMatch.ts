type FindAnnotationMatchArgs = {
    fullText: string;
    anchorText: string;
    anchorOccurrence?: number;
};

export type AnnotationMatch = {
    start: number;
    length: number;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findExactMatches = (fullText: string, anchorText: string): AnnotationMatch[] => {
    if (!anchorText) return [];
    const matches: AnnotationMatch[] = [];
    let cursor = 0;
    while (cursor <= fullText.length) {
        const start = fullText.indexOf(anchorText, cursor);
        if (start < 0) break;
        matches.push({ start, length: anchorText.length });
        cursor = start + Math.max(1, anchorText.length);
    }
    return matches;
};

export const findAnnotationMatch = ({
    fullText,
    anchorText,
    anchorOccurrence,
}: FindAnnotationMatchArgs): AnnotationMatch | null => {
    const trimmedAnchor = anchorText.trim();
    if (!fullText || !trimmedAnchor) return null;

    const exactMatches = findExactMatches(fullText, trimmedAnchor);
    if (exactMatches.length > 0) {
        if (
            typeof anchorOccurrence === 'number'
            && Number.isInteger(anchorOccurrence)
            && anchorOccurrence >= 0
            && anchorOccurrence < exactMatches.length
        ) {
            return exactMatches[anchorOccurrence];
        }
        return exactMatches[0];
    }

    const loosePattern = escapeRegExp(trimmedAnchor).replace(/\s+/g, '\\s+');
    const looseRegex = new RegExp(loosePattern);
    const looseMatch = looseRegex.exec(fullText);
    if (!looseMatch || looseMatch.index < 0) return null;

    return {
        start: looseMatch.index,
        length: looseMatch[0].length,
    };
};
