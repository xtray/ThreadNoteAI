import type { Note } from '../store/slices/notesSlice';
import type { ChatSession } from '../store/slices/sessionSlice';

export interface HighlightSegment {
    text: string;
    matched: boolean;
}

export interface SidebarResult {
    label: string;
    segments: HighlightSegment[];
}

export interface ChatSearchTarget {
    messageId: string;
    messageIndex: number;
    normalizedQuery: string;
}

export interface NoteSearchTarget {
    section: 'title' | 'content';
    normalizedQuery: string;
}

const DEFAULT_CHAT_TITLE = 'New chat';
const DEFAULT_CHAT_LABEL_MAX = 36;
const SNIPPET_RADIUS = 18;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeSearchQuery = (query: string) => collapseWhitespace(query).toLowerCase();

const truncateText = (text: string, maxLength: number) => (
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
);

export const buildSearchHighlightSegments = (label: string, query: string): HighlightSegment[] => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return [{ text: label, matched: false }];
    }

    const lowerLabel = label.toLowerCase();
    const segments: HighlightSegment[] = [];
    let cursor = 0;

    while (cursor < label.length) {
        const matchIndex = lowerLabel.indexOf(normalizedQuery, cursor);
        if (matchIndex === -1) {
            segments.push({ text: label.slice(cursor), matched: false });
            break;
        }

        if (matchIndex > cursor) {
            segments.push({ text: label.slice(cursor, matchIndex), matched: false });
        }

        const matchEnd = matchIndex + normalizedQuery.length;
        segments.push({ text: label.slice(matchIndex, matchEnd), matched: true });
        cursor = matchEnd;
    }

    return segments.filter((segment) => segment.text.length > 0);
};

const buildSnippet = (text: string, query: string) => {
    const collapsed = collapseWhitespace(text);
    const normalizedQuery = normalizeSearchQuery(query);
    if (!collapsed || !normalizedQuery) {
        return collapsed;
    }

    const lowerCollapsed = collapsed.toLowerCase();
    const matchIndex = lowerCollapsed.indexOf(normalizedQuery);
    if (matchIndex === -1) {
        return collapsed;
    }

    const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
    const end = Math.min(collapsed.length, matchIndex + normalizedQuery.length + SNIPPET_RADIUS);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < collapsed.length ? '...' : '';
    return `${prefix}${collapsed.slice(start, end).trim()}${suffix}`;
};

const makeSidebarResult = (label: string, query: string): SidebarResult => ({
    label,
    segments: buildSearchHighlightSegments(label, query),
});

export const getSessionTitle = (session: ChatSession) => {
    const firstUser = session.messages.find((message) => message.role === 'user');
    if (!firstUser?.content) {
        return DEFAULT_CHAT_TITLE;
    }

    const singleLine = collapseWhitespace(firstUser.content);
    if (!singleLine) {
        return DEFAULT_CHAT_TITLE;
    }

    return truncateText(singleLine, DEFAULT_CHAT_LABEL_MAX);
};

export const buildChatSidebarResult = (session: ChatSession, query: string): SidebarResult | null => {
    const defaultLabel = getSessionTitle(session);
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return makeSidebarResult(defaultLabel, '');
    }

    for (const message of session.messages) {
        const collapsed = collapseWhitespace(message.content);
        if (!collapsed || !collapsed.toLowerCase().includes(normalizedQuery)) {
            continue;
        }

        const label = message.role === 'user' && defaultLabel.toLowerCase().includes(normalizedQuery)
            ? defaultLabel
            : buildSnippet(collapsed, normalizedQuery);
        return makeSidebarResult(label, normalizedQuery);
    }

    return null;
};

export const buildChatSearchTarget = (session: ChatSession, query: string): ChatSearchTarget | null => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return null;
    }

    for (let index = 0; index < session.messages.length; index += 1) {
        const message = session.messages[index];
        const collapsed = collapseWhitespace(message.content);
        if (!collapsed || !collapsed.toLowerCase().includes(normalizedQuery)) {
            continue;
        }

        return {
            messageId: message.id,
            messageIndex: index,
            normalizedQuery,
        };
    }

    return null;
};

export const buildNoteSidebarResult = (note: Note, query: string): SidebarResult | null => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return makeSidebarResult(note.title, '');
    }

    const title = collapseWhitespace(note.title);
    if (title.toLowerCase().includes(normalizedQuery)) {
        return makeSidebarResult(title, normalizedQuery);
    }

    const content = collapseWhitespace(note.content);
    if (!content.toLowerCase().includes(normalizedQuery)) {
        return null;
    }

    return makeSidebarResult(buildSnippet(content, normalizedQuery), normalizedQuery);
};

export const buildNoteSearchTarget = (note: Note, query: string): NoteSearchTarget | null => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
        return null;
    }

    const title = collapseWhitespace(note.title);
    if (title.toLowerCase().includes(normalizedQuery)) {
        return {
            section: 'title',
            normalizedQuery,
        };
    }

    const content = collapseWhitespace(note.content);
    if (!content.toLowerCase().includes(normalizedQuery)) {
        return null;
    }

    return {
        section: 'content',
        normalizedQuery,
    };
};
