export type TextSegment = {
    node: Text;
    start: number;
    end: number;
};

export type SegmentHighlightRange = {
    node: Text;
    startOffset: number;
    endOffset: number;
};

export type AnnotationTextMatch = {
    start: number;
    length: number;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findExactOccurrence = (
    fullText: string,
    anchorText: string,
    occurrenceIndex: number
): AnnotationTextMatch | null => {
    let fromIndex = 0;
    for (let index = 0; index <= occurrenceIndex; index += 1) {
        const start = fullText.indexOf(anchorText, fromIndex);
        if (start < 0) return null;
        if (index === occurrenceIndex) {
            return { start, length: anchorText.length };
        }
        fromIndex = start + Math.max(anchorText.length, 1);
    }
    return null;
};

export const findAnnotationTextMatch = (
    fullText: string,
    anchorText: string,
    occurrenceIndex = 0
): AnnotationTextMatch | null => {
    const normalizedOccurrenceIndex = Math.max(0, Math.trunc(occurrenceIndex || 0));
    const exactMatch = findExactOccurrence(fullText, anchorText, normalizedOccurrenceIndex);
    if (exactMatch) return exactMatch;

    const loosePattern = escapeRegExp(anchorText).replace(/\s+/g, '\\s+');
    const looseRegex = new RegExp(loosePattern, 'g');
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = looseRegex.exec(fullText)) !== null) {
        if (index === normalizedOccurrenceIndex) {
            return { start: match.index, length: match[0].length };
        }
        index += 1;
        if (match[0].length === 0) {
            looseRegex.lastIndex += 1;
        }
    }

    return null;
};

export const getAnchorOccurrenceIndex = (textBeforeSelection: string, anchorText: string) => {
    if (!anchorText) return 0;
    let occurrenceIndex = 0;
    let fromIndex = 0;
    while (fromIndex <= textBeforeSelection.length) {
        const index = textBeforeSelection.indexOf(anchorText, fromIndex);
        if (index < 0) break;
        occurrenceIndex += 1;
        fromIndex = index + Math.max(anchorText.length, 1);
    }
    return occurrenceIndex;
};

export const getSegmentHighlightRanges = (
    segments: TextSegment[],
    matchStart: number,
    matchEnd: number
): SegmentHighlightRange[] => segments
    .map((segment) => {
        const start = Math.max(matchStart, segment.start);
        const end = Math.min(matchEnd, segment.end);
        return {
            node: segment.node,
            startOffset: start - segment.start,
            endOffset: end - segment.start,
        };
    })
    .filter((range) => range.endOffset > range.startOffset);

export const safelySurroundRangeContents = (range: Range, wrapper: HTMLElement) => {
    try {
        range.surroundContents(wrapper);
        return true;
    } catch {
        try {
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
            return true;
        } catch {
            return false;
        }
    }
};
