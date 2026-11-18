import axios from 'axios';
import { Message } from '../store/slices/sessionSlice';
import { getModelById, getProviderById } from './models';
import type { ConfigState } from '../store/slices/configSlice';
import { findCustomModel, normalizeBaseUrl } from './customModels';

const isExtensionRuntime = () =>
    typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';

const isDevWebRuntime = () => import.meta.env.DEV && !isExtensionRuntime();
const extensionApi = () => (globalThis as any).chrome;

type ProxyRequest = {
    url: string;
    method?: 'POST';
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
};

type ResolvedChatRequest = {
    providerId: string | null;
    modelName: string;
    apiKey: string;
    url: string;
    providerBaseUrl: string;
    headers: Record<string, string>;
    customBaseUrl: string;
};

const extractProviderError = (data: any) =>
    data?.error?.message
    || data?.base_resp?.status_msg
    || data?.raw
    || 'Request failed';

const postJson = async (
    req: ProxyRequest,
    signal?: AbortSignal,
): Promise<any> => {
    if (isExtensionRuntime()) {
        const chromeApi = extensionApi();
        if (!chromeApi?.runtime?.sendMessage) {
            throw new Error('Extension runtime is unavailable');
        }

        const result = await new Promise<any>((resolve, reject) => {
            chromeApi.runtime.sendMessage(
                { type: 'threadnote:proxy-fetch', ...req },
                (response: any) => {
                    const runtimeError = chromeApi.runtime.lastError;
                    if (runtimeError) {
                        reject(new Error(runtimeError.message || 'Extension proxy failed'));
                        return;
                    }
                    resolve(response);
                },
            );
        });

        if (!result?.ok) {
            throw new Error(result?.error || extractProviderError(result?.data));
        }
        return result.data;
    }

    const response = await axios.post(req.url, req.body, {
        headers: req.headers,
        signal,
    });
    return response.data;
};

const makeAbortError = () => {
    const error = new Error('Aborted');
    (error as Error & { name: string }).name = 'AbortError';
    return error;
};

const streamViaExtension = async (
    req: ProxyRequest,
    onChunk: (chunk: string) => void,
    onResponse?: (meta: { ok: boolean; status: number; contentType: string }) => void,
    signal?: AbortSignal,
): Promise<{ ok: boolean; status: number; contentType: string; bodyText: string }> => {
    const chromeApi = extensionApi();
    if (!chromeApi?.runtime?.connect) {
        throw new Error('Extension runtime stream API is unavailable');
    }

    return await new Promise((resolve, reject) => {
        const port = chromeApi.runtime.connect({ name: 'threadnote:proxy-stream' });
        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let settled = false;
        let bodyText = '';
        let meta: { ok: boolean; status: number; contentType: string } | null = null;

        const cleanup = () => {
            try {
                port.onMessage.removeListener(onMessage);
                port.onDisconnect.removeListener(onDisconnect);
            } catch { /* ignore */ }
            signal?.removeEventListener('abort', onAbort);
            try {
                port.disconnect();
            } catch { /* ignore */ }
        };

        const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            cleanup();
            fn();
        };

        const onAbort = () => {
            try {
                port.postMessage({ type: 'cancel', requestId });
            } catch { /* ignore */ }
            finish(() => reject(makeAbortError()));
        };

        const onMessage = (message: any) => {
            if (!message || message.requestId !== requestId) return;

            if (message.type === 'response') {
                meta = {
                    ok: !!message.ok,
                    status: Number(message.status) || 0,
                    contentType: typeof message.contentType === 'string' ? message.contentType : '',
                };
                try {
                    onResponse?.(meta);
                } catch (error) {
                    finish(() => reject(error));
                }
                return;
            }

            if (message.type === 'chunk') {
                const chunk = typeof message.chunk === 'string' ? message.chunk : '';
                bodyText += chunk;
                try {
                    onChunk(chunk);
                } catch (error) {
                    finish(() => reject(error));
                }
                return;
            }

            if (message.type === 'done') {
                const resolvedMeta = meta || { ok: true, status: 200, contentType: '' };
                finish(() => resolve({ ...resolvedMeta, bodyText }));
                return;
            }

            if (message.type === 'aborted') {
                finish(() => reject(makeAbortError()));
                return;
            }

            if (message.type === 'error') {
                finish(() => reject(new Error(message.error || 'Extension proxy stream failed')));
            }
        };

        const onDisconnect = () => {
            if (settled) return;
            const runtimeError = chromeApi.runtime.lastError;
            finish(() => reject(new Error(runtimeError?.message || 'Extension proxy stream disconnected')));
        };

        if (signal?.aborted) {
            finish(() => reject(makeAbortError()));
            return;
        }

        signal?.addEventListener('abort', onAbort, { once: true });
        port.onMessage.addListener(onMessage);
        port.onDisconnect.addListener(onDisconnect);
        port.postMessage({ type: 'start', requestId, ...req });
    });
};

type SseState = {
    buffer: string;
    full: string;
};

const parseOpenAICompatSseChunk = (
    chunk: string,
    state: SseState,
    onContent: (content: string) => void,
) => {
    state.buffer += chunk;
    const lines = state.buffer.split('\n');
    state.buffer = lines.pop() || '';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        let parsed: any;
        try {
            parsed = JSON.parse(data);
        } catch {
            continue;
        }

        if (parsed?.error) {
            throw new Error(extractProviderError(parsed));
        }

        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
            state.full += delta;
            onContent(state.full);
        }
    }
};

const parseAnthropicSseChunk = (
    chunk: string,
    state: SseState,
    onContent: (content: string) => void,
) => {
    state.buffer += chunk;
    const lines = state.buffer.split('\n');
    state.buffer = lines.pop() || '';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        let parsed: any;
        try {
            parsed = JSON.parse(data);
        } catch {
            continue;
        }

        if (parsed?.type === 'error' || parsed?.error) {
            throw new Error(extractProviderError(parsed));
        }

        const text = parsed?.type === 'content_block_delta'
            ? parsed?.delta?.text
            : null;
        if (typeof text === 'string' && text.length > 0) {
            state.full += text;
            onContent(state.full);
        }
    }
};

const parseGoogleSseChunk = (
    chunk: string,
    state: SseState,
    onContent: (content: string) => void,
) => {
    state.buffer += chunk;
    const lines = state.buffer.split('\n');
    state.buffer = lines.pop() || '';

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        let parsed: any;
        try {
            parsed = JSON.parse(data);
        } catch {
            continue;
        }

        if (parsed?.error) {
            throw new Error(extractProviderError(parsed));
        }

        const text = parsed?.candidates?.[0]?.content?.parts
            ?.map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
            .join('') || '';
        if (!text) continue;

        state.full += text;
        onContent(state.full);
    }
};

const resolveChatRequest = (
    modelId: string,
    config: Pick<ConfigState, 'apiKeys' | 'customProviders'>,
): ResolvedChatRequest => {
    const model = getModelById(modelId);
    let modelName = '';
    let apiKey = '';
    let url = '';
    let authHeader = 'Authorization';
    let authPrefix = 'Bearer ';
    let customBaseUrl = '';
    let providerBaseUrl = '';
    let providerId: string | null = null;

    if (model) {
        const provider = getProviderById(model.providerId);
        if (!provider) throw new Error(`Unknown provider: ${model.providerId}`);

        apiKey = config.apiKeys[model.providerId];
        if (!apiKey) throw new Error(`API Key not configured for ${provider.name}`);

        providerId = provider.id;
        modelName = model.name;
        providerBaseUrl = normalizeBaseUrl(provider.baseUrl);
        url = isDevWebRuntime()
            ? `${provider.proxyPath}/chat/completions`
            : `${providerBaseUrl}/chat/completions`;
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

        modelName = custom.modelName;
        apiKey = custom.provider.apiKey;
        customBaseUrl = baseUrl;
        url = isDevWebRuntime()
            ? '/api/custom/chat/completions'
            : `${customBaseUrl}/chat/completions`;
    }

    return {
        providerId,
        modelName,
        apiKey,
        url,
        providerBaseUrl,
        headers: {
            [authHeader]: `${authPrefix}${apiKey}`,
            'Content-Type': 'application/json',
        },
        customBaseUrl,
    };
};

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
    const resolved = resolveChatRequest(modelId, config);
    if (resolved.providerId === 'anthropic') {
        const data = await postJson({
            url: isDevWebRuntime() ? '/api/anthropic/v1/messages' : `${resolved.providerBaseUrl}/v1/messages`,
            headers: {
                'x-api-key': resolved.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            body: {
                model: resolved.modelName,
                max_tokens: 4096,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
            },
        }, signal);

        const text = data?.content?.find((item: any) => item?.type === 'text')?.text;
        if (!text) throw new Error('Anthropic response has no text content');
        return text;
    }

    if (resolved.providerId === 'google') {
        const data = await postJson({
            url: isDevWebRuntime()
                ? `/api/google/v1beta/models/${encodeURIComponent(resolved.modelName)}:generateContent?key=${encodeURIComponent(resolved.apiKey)}`
                : `${resolved.providerBaseUrl}/v1beta/models/${encodeURIComponent(resolved.modelName)}:generateContent?key=${encodeURIComponent(resolved.apiKey)}`,
            body: {
                contents: messages.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                },
            },
        }, signal);

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Google response has no text content');
        return text;
    }

    const payload: Record<string, unknown> = {
        model: resolved.modelName,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 4096,
    };
    if (resolved.customBaseUrl && isDevWebRuntime()) {
        payload._threadnoteBaseUrl = resolved.customBaseUrl;
    }

    const data = await postJson({
        url: resolved.url,
        headers: resolved.headers,
        body: payload,
    }, signal);

    return data.choices[0].message.content;
};

export const callAIStream = async (
    modelId: string,
    messages: Message[],
    config: Pick<ConfigState, 'apiKeys' | 'customProviders'>,
    onContent: (content: string) => void,
    signal?: AbortSignal,
): Promise<string> => {
    const resolved = resolveChatRequest(modelId, config);
    let streamUrl = resolved.url;
    let streamHeaders = resolved.headers;
    let payload: Record<string, unknown>;
    let parseChunk: (chunk: string, state: SseState, onContentCb: (content: string) => void) => void;
    let parseJsonFallback: (data: any) => string;

    if (resolved.providerId === 'anthropic') {
        payload = {
            model: resolved.modelName,
            max_tokens: 4096,
            stream: true,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
        };
        parseChunk = parseAnthropicSseChunk;
        parseJsonFallback = (data: any) =>
            data?.content?.find((item: any) => item?.type === 'text')?.text ?? '';
        streamUrl = isDevWebRuntime() ? '/api/anthropic/v1/messages' : `${resolved.providerBaseUrl}/v1/messages`;
        streamHeaders = {
            'x-api-key': resolved.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        };
    } else if (resolved.providerId === 'google') {
        payload = {
            contents: messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        };
        parseChunk = parseGoogleSseChunk;
        parseJsonFallback = (data: any) => data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        streamUrl = isDevWebRuntime()
            ? `/api/google/v1beta/models/${encodeURIComponent(resolved.modelName)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(resolved.apiKey)}`
            : `${resolved.providerBaseUrl}/v1beta/models/${encodeURIComponent(resolved.modelName)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(resolved.apiKey)}`;
        streamHeaders = {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        };
    } else {
        payload = {
            model: resolved.modelName,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: true,
        };
        if (resolved.customBaseUrl && isDevWebRuntime()) {
            payload._threadnoteBaseUrl = resolved.customBaseUrl;
        }
        parseChunk = parseOpenAICompatSseChunk;
        parseJsonFallback = (data: any) => data?.choices?.[0]?.message?.content ?? '';
    }

    const sseState: SseState = { buffer: '', full: '' };

    if (isExtensionRuntime()) {
        let extContentType = '';
        const result = await streamViaExtension({
            url: streamUrl,
            method: 'POST',
            headers: streamHeaders,
            body: payload,
        }, (chunk) => {
            if (extContentType.includes('text/event-stream')) {
                parseChunk(chunk, sseState, onContent);
            }
        }, (meta) => {
            extContentType = (meta.contentType || '').toLowerCase();
        }, signal);

        const contentType = (result.contentType || '').toLowerCase();
        if (!result.ok) {
            let parsedError: any = null;
            try {
                parsedError = JSON.parse(result.bodyText);
            } catch { /* ignore */ }
            if (parsedError) {
                throw new Error(extractProviderError(parsedError));
            }
            throw new Error(result.bodyText || `HTTP ${result.status}`);
        }

        if (contentType.includes('application/json')) {
            let data: any = null;
            try {
                data = result.bodyText ? JSON.parse(result.bodyText) : null;
            } catch { /* ignore */ }
            const full = parseJsonFallback(data);
            onContent(full);
            return full;
        }
        if (contentType.includes('text/event-stream')) {
            parseChunk('\n', sseState, onContent);
            return sseState.full;
        }
        return result.bodyText;
    }

    const response = await fetch(streamUrl, {
        method: 'POST',
        headers: streamHeaders,
        body: JSON.stringify(payload),
        signal,
    });
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!response.ok) {
        const errorText = await response.text();
        let parsedError: any = null;
        try {
            parsedError = JSON.parse(errorText);
        } catch { /* ignore */ }
        if (parsedError) {
            throw new Error(extractProviderError(parsedError));
        }
        throw new Error(errorText || `HTTP ${response.status}`);
    }
    if (contentType.includes('application/json')) {
        const data = await response.json();
        const full = parseJsonFallback(data);
        onContent(full);
        return full;
    }
    if (!response.body) {
        throw new Error('Streaming response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        parseChunk(chunk, sseState, onContent);
    }

    parseChunk('\n', sseState, onContent);
    return sseState.full;
};
