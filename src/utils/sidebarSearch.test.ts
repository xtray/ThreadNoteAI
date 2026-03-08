import { describe, expect, it } from 'vitest';
import type { ChatSession } from '../store/slices/sessionSlice';
import type { Note } from '../store/slices/notesSlice';
import { buildChatSidebarResult, buildNoteSidebarResult } from './sidebarSearch';

const makeSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
    id: 'session-1',
    parentId: null,
    anchorText: null,
    anchorMessageId: null,
    modelId: 'model-1',
    isLoading: false,
    messages: [],
    ...overrides,
});

const makeNote = (overrides: Partial<Note> = {}): Note => ({
    id: 'note-1',
    title: 'Untitled Note',
    fileName: 'untitled-note.md',
    content: '',
    updatedAt: 1,
    ...overrides,
});

describe('buildChatSidebarResult', () => {
    it('falls back to the first user summary when query is empty', () => {
        const session = makeSession({
            messages: [
                { id: 'm1', role: 'user', content: 'First question about indexing', timestamp: 1 },
                { id: 'm2', role: 'assistant', content: 'Reply', timestamp: 2 },
            ],
        });

        const result = buildChatSidebarResult(session, '');

        expect(result).not.toBeNull();
        expect(result?.label).toBe('First question about indexing');
        expect(result?.segments).toEqual([{ text: 'First question about indexing', matched: false }]);
    });

    it('returns a later-message snippet when the query is outside the default summary', () => {
        const session = makeSession({
            messages: [
                { id: 'm1', role: 'user', content: 'Short opener', timestamp: 1 },
                { id: 'm2', role: 'assistant', content: 'The deployment checklist covers release rollback safety and observability.', timestamp: 2 },
            ],
        });

        const result = buildChatSidebarResult(session, 'rollback');

        expect(result).not.toBeNull();
        expect(result?.label).toContain('rollback');
        expect(result?.label).not.toBe('Short opener');
        expect(result?.segments.some((segment) => segment.matched && /rollback/i.test(segment.text))).toBe(true);
    });

    it('returns null when the query does not match any message', () => {
        const session = makeSession({
            messages: [
                { id: 'm1', role: 'user', content: 'Shopping list', timestamp: 1 },
                { id: 'm2', role: 'assistant', content: 'Milk and bread', timestamp: 2 },
            ],
        });

        expect(buildChatSidebarResult(session, 'observability')).toBeNull();
    });
});

describe('buildNoteSidebarResult', () => {
    it('prefers a title match over a content match', () => {
        const note = makeNote({
            title: 'Search rollout plan',
            content: 'The body also mentions rollout details.',
        });

        const result = buildNoteSidebarResult(note, 'rollout');

        expect(result).not.toBeNull();
        expect(result?.label).toBe('Search rollout plan');
        expect(result?.segments).toEqual([
            { text: 'Search ', matched: false },
            { text: 'rollout', matched: true },
            { text: ' plan', matched: false },
        ]);
    });

    it('falls back to a content snippet when the title misses', () => {
        const note = makeNote({
            title: 'Release notes',
            content: 'Monitor background indexing after deploy and verify alert routing.',
        });

        const result = buildNoteSidebarResult(note, 'alert');

        expect(result).not.toBeNull();
        expect(result?.label).toContain('alert');
        expect(result?.label).not.toBe('Release notes');
        expect(result?.segments.some((segment) => segment.matched && /alert/i.test(segment.text))).toBe(true);
    });
});
