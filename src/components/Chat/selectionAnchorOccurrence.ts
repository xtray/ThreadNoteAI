type ResolveAnchorOccurrenceFromSelectionArgs = {
    fullText: string;
    anchorText: string;
    selectionStart: number;
};

type ResolveSelectionAnchorOccurrenceArgs = {
    root: HTMLElement | null;
    range: Range | null;
    anchorText: string;
};

const findExactMatchStarts = (fullText: string, anchorText: string) => {
    if (!anchorText) return [] as number[];
    const starts: number[] = [];
    let cursor = 0;
    while (cursor <= fullText.length) {
        const start = fullText.indexOf(anchorText, cursor);
        if (start < 0) break;
        starts.push(start);
        cursor = start + Math.max(1, anchorText.length);
    }
    return starts;
};

export const resolveAnchorOccurrenceFromSelection = ({
    fullText,
    anchorText,
    selectionStart,
}: ResolveAnchorOccurrenceFromSelectionArgs) => {
    const trimmedAnchor = anchorText.trim();
    if (!fullText || !trimmedAnchor) return null;
    if (!Number.isFinite(selectionStart) || selectionStart < 0) return null;

    const starts = findExactMatchStarts(fullText, trimmedAnchor);
    if (starts.length === 0) return null;

    const containingIndex = starts.findIndex((start) => (
        selectionStart >= start && selectionStart <= start + trimmedAnchor.length
    ));
    if (containingIndex >= 0) {
        return containingIndex;
    }

    let nearestIndex = 0;
    let nearestDistance = Math.abs(starts[0] - selectionStart);
    for (let i = 1; i < starts.length; i += 1) {
        const distance = Math.abs(starts[i] - selectionStart);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
        }
    }
    return nearestIndex;
};

export const resolveSelectionAnchorOccurrence = ({
    root,
    range,
    anchorText,
}: ResolveSelectionAnchorOccurrenceArgs) => {
    if (!root || !range) return null;
    if (!root.contains(range.commonAncestorContainer)) return null;

    const startContainer = range.startContainer;
    if (!(startContainer instanceof Text)) {
        return null;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const text = node.textContent || '';
            if (!text.trim()) return NodeFilter.FILTER_SKIP;
            const parent = (node as Text).parentElement;
            if (!parent) return NodeFilter.FILTER_SKIP;
            if (parent.closest('.annotation-highlight')) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
        },
    });

    let fullText = '';
    let selectionStartInFullText: number | null = null;
    let current: Node | null = walker.nextNode();
    while (current) {
        const textNode = current as Text;
        const text = textNode.textContent || '';
        const start = fullText.length;
        const end = start + text.length;
        if (textNode === startContainer) {
            selectionStartInFullText = start + Math.max(0, Math.min(range.startOffset, text.length));
        }
        fullText += text;
        if (selectionStartInFullText !== null && selectionStartInFullText <= end) {
            // Keep walking only to build fullText for stable occurrence detection.
        }
        current = walker.nextNode();
    }

    if (selectionStartInFullText === null) return null;
    return resolveAnchorOccurrenceFromSelection({
        fullText,
        anchorText,
        selectionStart: selectionStartInFullText,
    });
};
