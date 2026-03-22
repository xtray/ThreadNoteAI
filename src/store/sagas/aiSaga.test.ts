import { describe, expect, it } from 'vitest';
import {
    handleRegenerateMessage,
    resolveRootSelectedModelIds,
    shouldUseRootMultiModelFlow,
} from './aiSaga';
import { sendMessage, setSessionLoading } from '../slices/sessionSlice';
import { put, select } from 'redux-saga/effects';

describe('aiSaga model selection', () => {
    it('uses payload override first, then dedupes and clamps', () => {
        const selected = resolveRootSelectedModelIds({
            selectedModelIdsOverride: ['model-b', 'model-a', 'model-b', '', 'model-c'],
            lastUsedSelectedModelIds: ['model-z'],
            defaultMainModelIds: ['model-x'],
            maxConcurrentMainModels: 2,
            fallbackModelId: 'model-fallback',
        });

        expect(selected).toEqual(['model-b', 'model-a']);
    });

    it('falls back to session last-used when override is empty', () => {
        const selected = resolveRootSelectedModelIds({
            selectedModelIdsOverride: [],
            lastUsedSelectedModelIds: ['model-c', 'model-c', 'model-a'],
            defaultMainModelIds: ['model-x'],
            maxConcurrentMainModels: 3,
            fallbackModelId: 'model-fallback',
        });

        expect(selected).toEqual(['model-c', 'model-a']);
    });

    it('falls back to config defaults when override and last-used are unavailable', () => {
        const selected = resolveRootSelectedModelIds({
            selectedModelIdsOverride: undefined,
            lastUsedSelectedModelIds: [],
            defaultMainModelIds: ['model-a', 'model-b'],
            maxConcurrentMainModels: 3,
            fallbackModelId: 'model-fallback',
        });

        expect(selected).toEqual(['model-a', 'model-b']);
    });

    it('uses primary model only when multi reply is disabled', () => {
        const selected = resolveRootSelectedModelIds({
            selectedModelIdsOverride: ['model-b', 'model-a'],
            lastUsedSelectedModelIds: ['model-c'],
            defaultMainModelIds: ['model-x'],
            maxConcurrentMainModels: 3,
            multiReplyEnabled: false,
            primaryModelId: 'model-primary',
            fallbackModelId: 'model-fallback',
        });

        expect(selected).toEqual(['model-primary']);
    });
});

describe('aiSaga root flow gate', () => {
    it('uses multi-model flow only for root sessions', () => {
        expect(shouldUseRootMultiModelFlow(null)).toBe(true);
        expect(shouldUseRootMultiModelFlow('assistant-msg-id')).toBe(false);
    });
});

describe('aiSaga regenerate flow', () => {
    it('reuses the previous user prompt without appending a duplicate user message', () => {
        const action = {
            type: 'sessions/regenerateMessage',
            payload: {
                sessionId: 'main',
                messageId: 'a1',
            },
        };

        const state = {
            sessions: {
                sessions: {
                    main: {
                        id: 'main',
                        parentId: null,
                        anchorText: null,
                        anchorMessageId: null,
                        modelId: 'model-main',
                        isLoading: false,
                        messages: [
                            { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
                            { id: 'a1', role: 'assistant', content: 'Partial answer', timestamp: 2 },
                        ],
                    },
                },
            },
        } as any;

        const generator = handleRegenerateMessage(action);

        expect(generator.next().value).toEqual(select());
        expect(generator.next(state).value).toEqual(put(sendMessage({
            sessionId: 'main',
            content: 'Question',
            skipUserMessageAdd: true,
            assistantMessageId: 'a1',
            contextEndIndexExclusive: 1,
        })));
        expect(generator.next().done).toBe(true);
    });

    it('regenerates only the active tab model inside the existing round for root multi-model sessions', () => {
        const action = {
            type: 'sessions/regenerateMessage',
            payload: {
                sessionId: 'main',
                messageId: 'a1',
            },
        };

        const state = {
            config: {
                apiKeys: {},
                customProviders: [],
            },
            sessions: {
                sessions: {
                    main: {
                        id: 'main',
                        parentId: null,
                        anchorText: null,
                        anchorMessageId: null,
                        modelId: 'model-a',
                        isLoading: false,
                        multiReplyEnabled: true,
                        messages: [
                            { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
                            { id: 'a1', role: 'assistant', content: 'Fallback', timestamp: 2, roundId: 'round-1', modelId: 'model-a' },
                        ],
                        multiModel: {
                            rounds: {
                                'round-1': {
                                    id: 'round-1',
                                    modelOrder: ['model-a', 'model-b'],
                                    modelReplies: {
                                        'model-a': { content: 'A', status: 'done' },
                                        'model-b': { content: 'B', status: 'done' },
                                    },
                                },
                            },
                            activeRoundId: 'round-1',
                            activeTabModelId: 'model-b',
                            roundActiveTabModelIds: {
                                'round-1': 'model-b',
                            },
                            primaryModelId: 'model-a',
                            lastUsedSelectedModelIds: ['model-a', 'model-b'],
                        },
                    },
                },
            },
        } as any;

        const generator = handleRegenerateMessage(action);

        expect(generator.next().value).toEqual(select());
        expect(generator.next(state).value).toEqual(put(setSessionLoading({
            sessionId: 'main',
            isLoading: true,
        })));
        const callEffect = generator.next().value as any;
        expect(callEffect?.payload?.fn?.name).toBe('streamRootModelReply');
        expect(callEffect?.payload?.args?.[0]).toEqual({
            sessionId: 'main',
            roundId: 'round-1',
            modelId: 'model-b',
            assistantMessageId: 'a1',
            messagesForAI: [
                { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
            ],
            config: {
                apiKeys: {},
                customProviders: [],
            },
            controllers: expect.any(Map),
        });
    });
});
