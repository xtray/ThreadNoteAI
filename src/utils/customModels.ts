export type CustomProviderConfig = {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
};

export const CUSTOM_MODEL_PREFIX = 'custom';

const normalizeSegment = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const makeCustomProviderId = (seed?: string) => {
    const base = normalizeSegment(seed || 'provider') || 'provider';
    return `${base}-${Date.now().toString(36)}`;
};

export const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '');

export const buildCustomModelId = (providerId: string, modelName: string) =>
    `${CUSTOM_MODEL_PREFIX}:${providerId}:${encodeURIComponent(modelName.trim())}`;

export const parseCustomModelId = (modelId: string): { providerId: string; modelName: string } | null => {
    if (!modelId.startsWith(`${CUSTOM_MODEL_PREFIX}:`)) return null;
    const [, providerId, encoded] = modelId.split(':');
    if (!providerId || !encoded) return null;
    return { providerId, modelName: decodeURIComponent(encoded) };
};

export const getCustomModelOptions = (customProviders: CustomProviderConfig[]) =>
    customProviders.flatMap((provider) =>
        provider.models
            .map((modelName) => modelName.trim())
            .filter(Boolean)
            .map((modelName) => ({
                id: buildCustomModelId(provider.id, modelName),
                providerId: provider.id,
                name: modelName,
                displayName: `${modelName} (${provider.name || 'Custom'})`,
            }))
    );

export const findCustomModel = (customProviders: CustomProviderConfig[], modelId: string) => {
    const parsed = parseCustomModelId(modelId);
    if (!parsed) return null;

    const provider = customProviders.find((p) => p.id === parsed.providerId);
    if (!provider) return null;

    const modelName = provider.models.find((m) => m.trim() === parsed.modelName);
    if (!modelName) return null;

    return { provider, modelName };
};

export const sanitizeCustomProviders = (providers: CustomProviderConfig[] | undefined): CustomProviderConfig[] => {
    if (!Array.isArray(providers)) return [];

    return providers
        .map((provider) => ({
            id: provider.id || makeCustomProviderId(provider.name),
            name: (provider.name || 'Custom Provider').trim(),
            baseUrl: normalizeBaseUrl(provider.baseUrl || ''),
            apiKey: provider.apiKey || '',
            models: Array.isArray(provider.models)
                ? provider.models.map((m) => m.trim()).filter(Boolean)
                : [],
        }))
        .filter((provider) => provider.id);
};
