import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from './models';
import { buildCustomModelId, sanitizeCustomProviders } from './customModels';
import {
    ConfigState,
    DEFAULT_THEME_EFFECT,
    sanitizeThemeEffect,
} from '../store/slices/configSlice';
import { sanitizeAppLanguage } from '../i18n/text';

export type AiConfigExportPayload = {
    format: 'threadnote-ai-config-export';
    version: 1;
    exportedAt: string;
    config: {
        models: Pick<ConfigState, 'mainModelId' | 'maxConcurrentMainModels' | 'defaultMainModelIds' | 'subModelId'>;
        providers: Pick<ConfigState, 'apiKeys' | 'customProviders'>;
        advanced: Pick<ConfigState, 'subSessionContextMode'>;
    };
};

type FlatAiConfig = Partial<Omit<ConfigState, 'settingsOpen'>>;

const readGroupedConfig = (rawConfig: unknown): FlatAiConfig => {
    if (!rawConfig || typeof rawConfig !== 'object') {
        return {};
    }

    const candidate = rawConfig as {
        models?: Partial<ConfigState>;
        providers?: Partial<ConfigState>;
        advanced?: Partial<ConfigState>;
    };

    return {
        ...candidate.models,
        ...candidate.providers,
        ...candidate.advanced,
    };
};

const clampMainModelSlots = (value: unknown): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 3;
    return Math.min(3, Math.max(1, Math.trunc(value)));
};

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
};

const getAvailableModelIds = (customProviders: ConfigState['customProviders']) => {
    const builtInModelIds = AVAILABLE_MODELS.map((model) => model.id);
    const customModelIds = customProviders.flatMap((provider) =>
        provider.models.map((modelName) => buildCustomModelId(provider.id, modelName))
    );
    return [...builtInModelIds, ...customModelIds];
};

const isModelIdAvailable = (modelIds: string[], modelId: string) => modelIds.includes(modelId);

const normalizeDefaultMainModelIds = (
    rawDefaultModelIds: unknown,
    modelIds: string[],
    maxConcurrentMainModels: number,
    fallbackModelId: string
) => {
    const preferredModelIds = asStringArray(rawDefaultModelIds);
    const uniqueValidModelIds: string[] = [];

    for (const modelId of preferredModelIds) {
        if (uniqueValidModelIds.length >= maxConcurrentMainModels) break;
        if (!isModelIdAvailable(modelIds, modelId) || uniqueValidModelIds.includes(modelId)) continue;
        uniqueValidModelIds.push(modelId);
    }

    if (
        uniqueValidModelIds.length < maxConcurrentMainModels &&
        isModelIdAvailable(modelIds, fallbackModelId) &&
        !uniqueValidModelIds.includes(fallbackModelId)
    ) {
        uniqueValidModelIds.push(fallbackModelId);
    }

    for (const modelId of modelIds) {
        if (uniqueValidModelIds.length >= maxConcurrentMainModels) break;
        if (uniqueValidModelIds.includes(modelId)) continue;
        uniqueValidModelIds.push(modelId);
    }

    if (uniqueValidModelIds.length === 0) {
        uniqueValidModelIds.push(DEFAULT_MODEL_ID);
    }

    return uniqueValidModelIds.slice(0, maxConcurrentMainModels);
};

export const exportAiConfig = (config: ConfigState): AiConfigExportPayload => ({
    format: 'threadnote-ai-config-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    config: {
        models: {
            mainModelId: config.mainModelId,
            maxConcurrentMainModels: config.maxConcurrentMainModels,
            defaultMainModelIds: config.defaultMainModelIds,
            subModelId: config.subModelId,
        },
        providers: {
            apiKeys: config.apiKeys,
            customProviders: config.customProviders,
        },
        advanced: {
            subSessionContextMode: config.subSessionContextMode,
        },
    },
});

export const importAiConfigPayload = (
    payload: unknown,
    fallback: ConfigState
): ConfigState => {
    const rawPayload = (payload && typeof payload === 'object' && 'config' in payload)
        ? (payload as { config?: Partial<ConfigState> }).config
        : payload as Partial<ConfigState> | undefined;
    const rawConfig = readGroupedConfig(rawPayload);

    const customProviders = sanitizeCustomProviders(rawConfig?.customProviders).map((provider) => ({
        ...provider,
        models: [...new Set(provider.models)],
    }));
    const availableModelIds = getAvailableModelIds(customProviders);
    const maxConcurrentMainModels = clampMainModelSlots(rawConfig?.maxConcurrentMainModels);
    const fallbackMainModelId = isModelIdAvailable(availableModelIds, fallback.mainModelId)
        ? fallback.mainModelId
        : DEFAULT_MODEL_ID;
    const defaultMainModelIds = normalizeDefaultMainModelIds(
        rawConfig?.defaultMainModelIds,
        availableModelIds,
        maxConcurrentMainModels,
        fallbackMainModelId
    );
    const mainModelId = defaultMainModelIds[0] || DEFAULT_MODEL_ID;
    const subModelId = typeof rawConfig?.subModelId === 'string' && isModelIdAvailable(availableModelIds, rawConfig.subModelId)
        ? rawConfig.subModelId
        : fallbackMainModelId;

    return {
        apiKeys: rawConfig?.apiKeys && typeof rawConfig.apiKeys === 'object'
            ? Object.fromEntries(
                Object.entries(rawConfig.apiKeys).filter(
                    (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'
                )
            )
            : {},
        mainModelId,
        maxConcurrentMainModels,
        defaultMainModelIds,
        subModelId,
        subSessionContextMode: rawConfig?.subSessionContextMode === 'keep' ? 'keep' : 'new',
        customProviders,
        language: sanitizeAppLanguage(rawConfig?.language ?? fallback.language),
        themeEffect: sanitizeThemeEffect(rawConfig?.themeEffect ?? DEFAULT_THEME_EFFECT),
        settingsOpen: false,
    };
};
