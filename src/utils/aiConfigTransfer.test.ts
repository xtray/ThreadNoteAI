import { describe, expect, it } from 'vitest';
import type { ConfigState } from '../store/slices/configSlice';
import { exportAiConfig, importAiConfigPayload } from './aiConfigTransfer';

const buildConfig = (): ConfigState => ({
    apiKeys: { openai: 'secret' },
    mainModelId: 'MiniMax-M2.5',
    maxConcurrentMainModels: 2,
    defaultMainModelIds: ['MiniMax-M2.5', 'deepseek-chat'],
    subModelId: 'gpt-4o',
    subSessionContextMode: 'keep',
    customProviders: [
        {
            id: 'custom-provider-1',
            name: 'NVIDIA',
            baseUrl: 'https://integrate.api.nvidia.com/v1',
            apiKey: 'custom-secret',
            models: ['meta/llama-3.1-70b-instruct'],
        },
    ],
    themeEffect: 'dark',
    settingsOpen: true,
});

describe('aiConfigTransfer', () => {
    it('exports model and provider configuration fields with metadata', () => {
        const payload = exportAiConfig(buildConfig());

        expect(payload).toEqual({
            format: 'threadnote-ai-config-export',
            version: 1,
            exportedAt: payload.exportedAt,
            config: {
                models: {
                    mainModelId: 'MiniMax-M2.5',
                    maxConcurrentMainModels: 2,
                    defaultMainModelIds: ['MiniMax-M2.5', 'deepseek-chat'],
                    subModelId: 'gpt-4o',
                },
                providers: {
                    apiKeys: { openai: 'secret' },
                    customProviders: [
                        {
                            id: 'custom-provider-1',
                            name: 'NVIDIA',
                            baseUrl: 'https://integrate.api.nvidia.com/v1',
                            apiKey: 'custom-secret',
                            models: ['meta/llama-3.1-70b-instruct'],
                        },
                    ],
                },
                advanced: {
                    subSessionContextMode: 'keep',
                },
            },
        });
        expect(payload.exportedAt).toMatch(/T/);
        expect(payload.config.models.defaultMainModelIds).toEqual(['MiniMax-M2.5', 'deepseek-chat']);
        expect(payload.config.models.subModelId).toBe('gpt-4o');
        expect(payload.config.providers.apiKeys).toEqual({ openai: 'secret' });
        expect(payload.config.providers.customProviders[0]).toMatchObject({
            name: 'NVIDIA',
            baseUrl: 'https://integrate.api.nvidia.com/v1',
            apiKey: 'custom-secret',
            models: ['meta/llama-3.1-70b-instruct'],
        });
    });

    it('imports AI config payloads with sanitization and fallback values', () => {
        const imported = importAiConfigPayload({
            format: 'threadnote-ai-config-export',
            version: 1,
            config: {
                models: {
                    mainModelId: 'missing-model',
                    maxConcurrentMainModels: 9,
                    defaultMainModelIds: ['missing-model', 'gpt-4o', 'gpt-4o'],
                    subModelId: 'missing-sub-model',
                },
                providers: {
                    apiKeys: { minimax: 'token' },
                    customProviders: [
                        {
                            id: 'custom-provider-2',
                            name: 'Broken Provider',
                            baseUrl: 'https://example.com/',
                            apiKey: 'provider-key',
                            models: ['model-a', '', 'model-a'],
                        },
                    ],
                },
                advanced: {
                    subSessionContextMode: 'keep',
                },
                settingsOpen: true,
                themeEffect: 'dark',
            },
        }, buildConfig());

        expect(imported.apiKeys).toEqual({ minimax: 'token' });
        expect(imported.maxConcurrentMainModels).toBe(3);
        expect(imported.defaultMainModelIds.length).toBe(3);
        expect(imported.defaultMainModelIds).not.toContain('missing-model');
        expect(imported.subModelId).toBe('MiniMax-M2.5');
        expect(imported.subSessionContextMode).toBe('keep');
        expect(imported.customProviders).toEqual([
            {
                id: 'custom-provider-2',
                name: 'Broken Provider',
                baseUrl: 'https://example.com',
                apiKey: 'provider-key',
                models: ['model-a'],
            },
        ]);
        expect(imported.settingsOpen).toBe(false);
        expect((imported as ConfigState).themeEffect).toBe('light');
    });

    it('ignores old flat config export payloads', () => {
        const imported = importAiConfigPayload({
            format: 'threadnote-ai-config-export',
            version: 1,
            config: {
                apiKeys: { anthropic: 'legacy-key' },
                mainModelId: 'MiniMax-M2.5',
                maxConcurrentMainModels: 1,
                defaultMainModelIds: ['MiniMax-M2.5'],
                subModelId: 'gpt-4o',
                subSessionContextMode: 'new',
                customProviders: [],
            },
        }, buildConfig());

        expect(imported.apiKeys).toEqual({});
        expect(imported.defaultMainModelIds[0]).toBe('MiniMax-M2.5');
        expect(imported.defaultMainModelIds.length).toBe(3);
        expect(imported.subSessionContextMode).toBe('new');
    });
});
