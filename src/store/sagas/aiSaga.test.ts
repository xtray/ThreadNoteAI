import { describe, expect, it } from 'vitest';
import {
    resolveRootSelectedModelIds,
    shouldUseRootMultiModelFlow,
} from './aiSaga';

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
