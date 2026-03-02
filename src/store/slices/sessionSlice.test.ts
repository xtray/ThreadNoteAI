import { describe, expect, it } from 'vitest';
import reducer, { SessionState } from './sessionSlice';

const buildState = (): SessionState => ({
    activeSessionId: 'main',
    sessions: {
        main: {
            id: 'main',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-main',
            isLoading: false,
            messages: [
                {
                    id: 'u1',
                    role: 'user',
                    content: 'Q1',
                    timestamp: 1,
                },
                {
                    id: 'a1',
                    role: 'assistant',
                    content: 'A1',
                    timestamp: 2,
                    annotations: [
                        {
                            id: 'anno-1',
                            subSessionId: 'sub-1',
                            anchorText: 'A1',
                            createdAt: 3,
                        },
                    ],
                },
                {
                    id: 'u2',
                    role: 'user',
                    content: 'Q2',
                    timestamp: 4,
                },
                {
                    id: 'a2',
                    role: 'assistant',
                    content: 'A2',
                    timestamp: 5,
                },
            ],
        },
        'sub-1': {
            id: 'sub-1',
            parentId: 'a1',
            anchorText: 'A1',
            anchorMessageId: 'a1',
            modelId: 'model-sub',
            isLoading: false,
            messages: [],
        },
    },
});

describe('sessionSlice removeTurn', () => {
    it('removes the matched user+assistant turn when clicking assistant message', () => {
        const start = buildState();

        const next = reducer(start, {
            type: 'sessions/removeTurn',
            payload: { sessionId: 'main', messageId: 'a1' },
        });

        expect(next.sessions.main.messages.map((m) => m.id)).toEqual(['u2', 'a2']);
        expect(next.sessions['sub-1']).toBeUndefined();
    });

    it('removes user+assistant turn when clicking user message', () => {
        const start = buildState();

        const next = reducer(start, {
            type: 'sessions/removeTurn',
            payload: { sessionId: 'main', messageId: 'u2' },
        });

        expect(next.sessions.main.messages.map((m) => m.id)).toEqual(['u1', 'a1']);
    });
});
