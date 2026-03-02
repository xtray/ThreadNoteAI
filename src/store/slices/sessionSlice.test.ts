import { describe, expect, it } from 'vitest';
import reducer, {
    createSession,
    initializeMultiModelRound,
    setSessionMultiReplyEnabled,
    SessionState,
    setMultiModelActiveTab,
    setMultiModelPrimaryModel,
    upsertMultiModelRoundReply,
} from './sessionSlice';

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

describe('sessionSlice multi-model rounds', () => {
    it('defaults root session multiReplyEnabled to true on createSession', () => {
        const start: SessionState = { activeSessionId: null, sessions: {} };
        const next = reducer(start, createSession({
            id: 'root-new',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-main',
            isLoading: false,
            messages: [],
        }));

        expect(next.sessions['root-new'].multiReplyEnabled).toBe(true);
    });

    it('updates multiReplyEnabled only for root sessions', () => {
        const start = buildState();
        const withRootToggle = reducer(start, setSessionMultiReplyEnabled({
            sessionId: 'main',
            enabled: false,
        }));
        const withSubToggle = reducer(withRootToggle, setSessionMultiReplyEnabled({
            sessionId: 'sub-1',
            enabled: false,
        }));

        expect(withRootToggle.sessions.main.multiReplyEnabled).toBe(false);
        expect(withSubToggle.sessions['sub-1'].multiReplyEnabled).toBeUndefined();
    });

    it('initializes root session multi-model round state', () => {
        const start = buildState();

        const next = reducer(start, initializeMultiModelRound({
            sessionId: 'main',
            roundId: 'round-1',
            selectedModelIds: ['model-a', 'model-b'],
            primaryModelId: 'model-b',
        }));

        expect(next.sessions.main.multiModel).toEqual({
            activeRoundId: 'round-1',
            activeTabModelId: 'model-b',
            roundActiveTabModelIds: {
                'round-1': 'model-b',
            },
            primaryModelId: 'model-b',
            lastUsedSelectedModelIds: ['model-a', 'model-b'],
            rounds: {
                'round-1': {
                    id: 'round-1',
                    modelOrder: ['model-a', 'model-b'],
                    modelReplies: {
                        'model-a': { content: '', status: 'idle' },
                        'model-b': { content: '', status: 'idle' },
                    },
                },
            },
        });
    });

    it('updates per-model round reply content and status', () => {
        const start = reducer(buildState(), initializeMultiModelRound({
            sessionId: 'main',
            roundId: 'round-1',
            selectedModelIds: ['model-a', 'model-b'],
        }));

        const next = reducer(start, upsertMultiModelRoundReply({
            sessionId: 'main',
            roundId: 'round-1',
            modelId: 'model-a',
            content: 'streaming chunk',
            status: 'streaming',
        }));

        expect(next.sessions.main.multiModel?.rounds['round-1'].modelReplies['model-a']).toEqual({
            content: 'streaming chunk',
            status: 'streaming',
        });
    });

    it('switches active tab and primary model independently', () => {
        const start = reducer(buildState(), initializeMultiModelRound({
            sessionId: 'main',
            roundId: 'round-1',
            selectedModelIds: ['model-a', 'model-b'],
            primaryModelId: 'model-a',
        }));

        const afterTabSwitch = reducer(start, setMultiModelActiveTab({
            sessionId: 'main',
            modelId: 'model-b',
        }));
        const next = reducer(afterTabSwitch, setMultiModelPrimaryModel({
            sessionId: 'main',
            modelId: 'model-b',
        }));

        expect(next.sessions.main.multiModel?.activeTabModelId).toBe('model-b');
        expect(next.sessions.main.multiModel?.roundActiveTabModelIds['round-1']).toBe('model-b');
        expect(next.sessions.main.multiModel?.primaryModelId).toBe('model-b');
    });

    it('switches tab for a historical round without changing active round tab', () => {
        const afterRoundOne = reducer(buildState(), initializeMultiModelRound({
            sessionId: 'main',
            roundId: 'round-1',
            selectedModelIds: ['model-a', 'model-b'],
            primaryModelId: 'model-a',
        }));
        const afterRoundTwo = reducer(afterRoundOne, initializeMultiModelRound({
            sessionId: 'main',
            roundId: 'round-2',
            selectedModelIds: ['model-c', 'model-d'],
            primaryModelId: 'model-c',
        }));

        const next = reducer(afterRoundTwo, setMultiModelActiveTab({
            sessionId: 'main',
            roundId: 'round-1',
            modelId: 'model-b',
        }));

        expect(next.sessions.main.multiModel?.activeRoundId).toBe('round-2');
        expect(next.sessions.main.multiModel?.activeTabModelId).toBe('model-c');
        expect(next.sessions.main.multiModel?.roundActiveTabModelIds['round-1']).toBe('model-b');
        expect(next.sessions.main.multiModel?.roundActiveTabModelIds['round-2']).toBe('model-c');
    });

    it('keeps sub-sessions on single-model behavior', () => {
        const start = buildState();

        const next = reducer(start, initializeMultiModelRound({
            sessionId: 'sub-1',
            roundId: 'round-sub',
            selectedModelIds: ['model-a', 'model-b'],
        }));

        expect(next.sessions['sub-1'].multiModel).toBeUndefined();
        expect(next.sessions.main.multiModel).toBeUndefined();
    });
});
