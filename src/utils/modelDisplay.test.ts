import { describe, expect, it } from 'vitest';
import { getProvisionedModelOptions } from './modelDisplay';

describe('getProvisionedModelOptions', () => {
    it('includes built-in models only for providers with API keys', () => {
        const options = getProvisionedModelOptions({
            apiKeys: {
                minimax: 'mini-key',
                openai: '',
                google: '   ',
            },
            customProviders: [],
        });

        expect(options.builtIn.map((model) => model.id)).toContain('MiniMax-M2.7');
        expect(options.builtIn.map((model) => model.id)).not.toContain('gpt-4o');
        expect(options.builtIn.map((model) => model.id)).not.toContain('gemini-1.5-pro-latest');
    });

    it('includes custom models only when the provider is fully provisioned', () => {
        const options = getProvisionedModelOptions({
            apiKeys: {},
            customProviders: [
                {
                    id: 'ready',
                    name: 'Ready Provider',
                    baseUrl: 'https://provider.example/v1',
                    apiKey: 'secret',
                    models: ['model-a', 'model-b'],
                },
                {
                    id: 'missing-key',
                    name: 'Missing Key',
                    baseUrl: 'https://provider.example/v1',
                    apiKey: '',
                    models: ['model-c'],
                },
                {
                    id: 'missing-url',
                    name: 'Missing URL',
                    baseUrl: '',
                    apiKey: 'secret',
                    models: ['model-d'],
                },
            ],
        });

        expect(options.custom.map((model) => model.id)).toEqual([
            'custom:ready:model-a',
            'custom:ready:model-b',
        ]);
    });
});
