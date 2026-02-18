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

    // OpenAI
    { id: 'gpt-4-turbo', providerId: 'openai', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', providerId: 'openai', name: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' },
];

// ─── Helpers ─────────────────────────────────────────────────
export const getProviderById = (id: string) =>
    SUPPORTED_PROVIDERS.find((p) => p.id === id);

export const getModelById = (id: string) =>
    AVAILABLE_MODELS.find((m) => m.id === id);

export const getModelsForProvider = (providerId: string) =>
    AVAILABLE_MODELS.filter((m) => m.providerId === providerId);
