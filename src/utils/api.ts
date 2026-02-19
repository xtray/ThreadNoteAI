import axios from 'axios';
import { Message } from '../store/slices/sessionSlice';
import { getModelById, getProviderById } from './models';
import type { ConfigState } from '../store/slices/configSlice';
import { findCustomModel, normalizeBaseUrl } from './customModels';

/**
 * Calls an AI model endpoint.
 * Uses the Vite dev-server proxy to bypass CORS.
 */
export const callAI = async (
    modelId: string,
    messages: Message[],
    config: Pick<ConfigState, 'apiKeys' | 'customProviders'>,
    signal?: AbortSignal,
): Promise<string> => {
    const model = getModelById(modelId);
    let resolvedModelName = '';
    let apiKey = '';
    let url = '';
    let authHeader = 'Authorization';
    let authPrefix = 'Bearer ';
    let customBaseUrl = '';

    if (model) {
        const provider = getProviderById(model.providerId);
        if (!provider) throw new Error(`Unknown provider: ${model.providerId}`);

        apiKey = config.apiKeys[model.providerId];
        if (!apiKey) throw new Error(`API Key not configured for ${provider.name}`);

        resolvedModelName = model.name;
        url = `${provider.proxyPath}/chat/completions`;
        authHeader = provider.authHeader;
        authPrefix = provider.authPrefix;
    } else {
        const custom = findCustomModel(config.customProviders, modelId);
        if (!custom) throw new Error(`Unknown model: ${modelId}`);

        if (!custom.provider.apiKey) {
            throw new Error(`API Key not configured for ${custom.provider.name || 'Custom Provider'}`);
        }
        const baseUrl = normalizeBaseUrl(custom.provider.baseUrl);
        if (!baseUrl) {
            throw new Error(`Base URL not configured for ${custom.provider.name || 'Custom Provider'}`);
        }

        resolvedModelName = custom.modelName;
        apiKey = custom.provider.apiKey;
        customBaseUrl = baseUrl;
        // Route through local dev proxy to avoid browser CORS issues.
        url = '/api/custom/chat/completions';
    }

    const provider = model ? getProviderById(model.providerId) : null;
    if (provider?.id === 'anthropic') {
        const response = await axios.post(
            '/api/anthropic/v1/messages',
            {
                model: resolvedModelName,
                max_tokens: 4096,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
            },
            {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                signal,
            },
        );

        const text = response.data?.content?.find((item: any) => item?.type === 'text')?.text;
        if (!text) throw new Error('Anthropic response has no text content');
        return text;
    }

    if (provider?.id === 'google') {
        const response = await axios.post(
            `/api/google/v1beta/models/${encodeURIComponent(resolvedModelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                contents: messages.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            },
            { signal },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Google response has no text content');
        return text;
    }

    const payload: Record<string, unknown> = {
        model: resolvedModelName,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 4096,
    };
    if (customBaseUrl) {
        payload._threadnoteBaseUrl = customBaseUrl;
    }

    const response = await axios.post(
        url,
        payload,
        {
            headers: {
                [authHeader]: `${authPrefix}${apiKey}`,
                'Content-Type': 'application/json',
            },
            signal,
        },
    );

    return response.data.choices[0].message.content;
};
