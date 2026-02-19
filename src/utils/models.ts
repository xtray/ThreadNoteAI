export interface ModelProvider {
    id: string;
    name: string;
    baseUrl: string;       // The real API base URL
    proxyPath: string;     // Local Vite proxy prefix (e.g. '/api/minimax')
    authHeader: string;    // Usually 'Authorization'
    authPrefix: string;    // Usually 'Bearer '
}

export interface Model {
    id: string;
    providerId: string;
    name: string;
    displayName: string;
}

export const DEFAULT_MODEL_ID = 'MiniMax-M2.5';

// ─── Providers ───────────────────────────────────────────────
export const SUPPORTED_PROVIDERS: ModelProvider[] = [
    {
        id: 'minimax',
        name: 'MiniMax',
        baseUrl: 'https://api.minimax.chat/v1',
        proxyPath: '/api/minimax',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
    },
    {
        id: 'zhipu',
        name: 'Zhipu GLM',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        proxyPath: '/api/glm',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        proxyPath: '/api/deepseek',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        proxyPath: '/api/openai',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        proxyPath: '/api/anthropic',
        authHeader: 'x-api-key',
        authPrefix: '',
    },
    {
        id: 'google',
        name: 'Google',
        baseUrl: 'https://generativelanguage.googleapis.com',
        proxyPath: '/api/google',
        authHeader: 'x-goog-api-key',
        authPrefix: '',
    },
];

// ─── Models ──────────────────────────────────────────────────
export const AVAILABLE_MODELS: Model[] = [
    // MiniMax
    { id: 'MiniMax-M2.5', providerId: 'minimax', name: 'MiniMax-M2.5', displayName: 'MiniMax M2.5' },
    { id: 'MiniMax-M2.5-highspeed', providerId: 'minimax', name: 'MiniMax-M2.5-highspeed', displayName: 'MiniMax M2.5 (Fast)' },

    // Zhipu GLM
    { id: 'glm-4-plus', providerId: 'zhipu', name: 'glm-4-plus', displayName: 'GLM-4 Plus' },
    { id: 'glm-4-air', providerId: 'zhipu', name: 'glm-4-air', displayName: 'GLM-4 Air' },
    { id: 'glm-4-flash', providerId: 'zhipu', name: 'glm-4-flash', displayName: 'GLM-4 Flash' },

    // DeepSeek
    { id: 'deepseek-chat', providerId: 'deepseek', name: 'deepseek-chat', displayName: 'DeepSeek Chat' },
    { id: 'deepseek-reasoner', providerId: 'deepseek', name: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner' },

    // OpenAI (ChatGPT)
    { id: 'gpt-4o', providerId: 'openai', name: 'gpt-4o', displayName: 'ChatGPT 4o' },
    { id: 'gpt-4o-mini', providerId: 'openai', name: 'gpt-4o-mini', displayName: 'ChatGPT 4o Mini' },

    // Anthropic
    { id: 'claude-3-5-sonnet-latest', providerId: 'anthropic', name: 'claude-3-5-sonnet-latest', displayName: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-latest', providerId: 'anthropic', name: 'claude-3-5-haiku-latest', displayName: 'Claude 3.5 Haiku' },

    // Google Gemini
    { id: 'gemini-1.5-pro-latest', providerId: 'google', name: 'gemini-1.5-pro-latest', displayName: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash-latest', providerId: 'google', name: 'gemini-1.5-flash-latest', displayName: 'Gemini 1.5 Flash' },
];

// ─── Helpers ─────────────────────────────────────────────────
export const getProviderById = (id: string) =>
    SUPPORTED_PROVIDERS.find((p) => p.id === id);

export const getModelById = (id: string) =>
    AVAILABLE_MODELS.find((m) => m.id === id);

export const getModelsForProvider = (providerId: string) =>
    AVAILABLE_MODELS.filter((m) => m.providerId === providerId);
