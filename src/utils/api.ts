import axios from 'axios';
import { Message } from '../store/slices/sessionSlice';
import { getModelById, getProviderById } from './models';

/**
 * Calls an AI model's chat completions endpoint.
 * Uses the Vite dev-server proxy to bypass CORS.
 *
 * All supported providers (Minimax, GLM, DeepSeek, OpenAI) use
 * the OpenAI-compatible chat/completions format.
 */
export const callAI = async (
    modelId: string,
    messages: Message[],
    apiKey: string,
    signal?: AbortSignal,
): Promise<string> => {
    const model = getModelById(modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const provider = getProviderById(model.providerId);
    if (!provider) throw new Error(`Unknown provider: ${model.providerId}`);

    if (!apiKey) throw new Error(`API Key not configured for ${provider.name}`);

    // Use the Vite proxy path during development
    const url = `${provider.proxyPath}/chat/completions`;

    const response = await axios.post(
        url,
        {
            model: model.name,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
        },
        {
            headers: {
                [provider.authHeader]: `${provider.authPrefix}${apiKey}`,
                'Content-Type': 'application/json',
            },
            signal,
        },
    );

    return response.data.choices[0].message.content;
};
