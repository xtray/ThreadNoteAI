import { describe, expect, it } from 'vitest';
import type { SessionState } from '../store/slices/sessionSlice';
import { exportAiChats, mergeImportedChats, overwriteImportedChats } from './aiChatsTransfer';

const buildCurrentState = (): SessionState => ({
    activeSessionId: 'current-root',
    sessions: {
        'current-root': {
            id: 'current-root',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-a',
            isLoading: false,
            multiReplyEnabled: true,
            messages: [
                { id: 'm1', role: 'user', content: 'hello', timestamp: 1 },
            ],
        },
        'current-sub': {
            id: 'current-sub',
            parentId: 'current-root',
            anchorText: 'hello',
            anchorMessageId: 'm1',
            modelId: 'model-b',
            isLoading: false,
            messages: [],
        },
    },
});

const buildImportedState = (): SessionState => ({
    activeSessionId: 'imported-root',
    sessions: {
        'current-root': {
            id: 'current-root',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-c',
            isLoading: false,
            multiReplyEnabled: false,
            messages: [
                { id: 'm2', role: 'assistant', content: 'replaced', timestamp: 2 },
            ],
        },
        'imported-root': {
            id: 'imported-root',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-d',
            isLoading: false,
            multiReplyEnabled: true,
            messages: [],
        },
    },
});

describe('aiChatsTransfer', () => {
    it('exports chats with metadata and the full session payload', () => {
        const payload = exportAiChats(buildCurrentState());

        expect(payload).toEqual({
            format: 'threadnote-ai-chats-export',
            version: 1,
            exportedAt: payload.exportedAt,
            activeSessionId: 'current-root',
            sessions: buildCurrentState().sessions,
        });
        expect(payload.exportedAt).toMatch(/T/);
    });

    it('overwrites chats and resolves imported active session safely', () => {
        const next = overwriteImportedChats(buildCurrentState(), buildImportedState());

        expect(Object.keys(next.sessions)).toEqual(['current-root', 'imported-root']);
        expect(next.sessions['current-root'].modelId).toBe('model-c');
        expect(next.activeSessionId).toBe('imported-root');
    });

    it('merges imported chats by session id and keeps current active session when still present', () => {
        const next = mergeImportedChats(buildCurrentState(), buildImportedState());

        expect(Object.keys(next.sessions)).toEqual(['current-root', 'current-sub', 'imported-root']);
        expect(next.sessions['current-root'].modelId).toBe('model-c');
        expect(next.sessions['current-sub']).toBeDefined();
        expect(next.activeSessionId).toBe('current-root');
    });
});
