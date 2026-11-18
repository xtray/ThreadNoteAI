import { describe, expect, it } from 'vitest';
import {
    handleRegenerateMessage,
    resolveRootSelectedModelIds,
    shouldUseRootMultiModelFlow,
} from './aiSaga';
import { sendMessage } from '../slices/sessionSlice';
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
});

describe('stream failure output', () => {
    it('retains generated text before showing a continuation failure', async () => {
        const { formatStreamFailure } = await import('./aiSaga');
        expect(formatStreamFailure('partial answer', 'network failure'))
            .toBe('partial answer\n\n❌ Request failed: network failure');
        expect(formatStreamFailure('', 'network failure')).toBe('❌ Request failed: network failure');
    });
});
