import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from '../../utils/models';
import {
    buildCustomModelId,
    CustomProviderConfig,
    makeCustomProviderId,
    sanitizeCustomProviders,
} from '../../utils/customModels';

export interface ConfigState {
    apiKeys: Record<string, string>;   // providerId → apiKey
    mainModelId: string;               // default model for main thread
    maxConcurrentMainModels: number;   // 1..3
    defaultMainModelIds: string[];     // selected main models (length 1..3)
    subModelId: string;                // default model for sub-thread
    subSessionContextMode: 'new' | 'keep';
    customProviders: CustomProviderConfig[];
    settingsOpen: boolean;
}

const STORAGE_KEY = 'threadnote_ai_config';
const MIN_MAIN_MODEL_SLOTS = 1;
const MAX_MAIN_MODEL_SLOTS = 3;
const DEFAULT_MAIN_MODEL_SLOTS = 3;

type StoredConfig = Partial<ConfigState> & {
    maxConcurrentMainModels?: unknown;
    defaultMainModelIds?: unknown;
};

const loadFromStorage = (): StoredConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
};

const saved = loadFromStorage();

const clampMainModelSlots = (value: unknown): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_MAIN_MODEL_SLOTS;
    return Math.min(MAX_MAIN_MODEL_SLOTS, Math.max(MIN_MAIN_MODEL_SLOTS, Math.trunc(value)));
};

const asStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
};

const getAvailableModelIds = (state: ConfigState): string[] => {
    const builtInModelIds = AVAILABLE_MODELS.map((model) => model.id);
    const customModelIds = state.customProviders.flatMap((provider) =>
        provider.models.map((modelName) => buildCustomModelId(provider.id, modelName))
    );
    return [...builtInModelIds, ...customModelIds];
};

const initialState: ConfigState = {
    apiKeys: saved.apiKeys ?? {},
    mainModelId: saved.mainModelId ?? DEFAULT_MODEL_ID,
    maxConcurrentMainModels: DEFAULT_MAIN_MODEL_SLOTS,
    defaultMainModelIds: [],
    subModelId: saved.subModelId ?? DEFAULT_MODEL_ID,
    subSessionContextMode: saved.subSessionContextMode ?? 'new',
    customProviders: sanitizeCustomProviders(saved.customProviders),
    settingsOpen: false,
};

const isModelIdAvailable = (state: ConfigState, modelId: string) => {
    if (AVAILABLE_MODELS.some((model) => model.id === modelId)) return true;
    return state.customProviders.some((provider) =>
        provider.models.some((model) => buildCustomModelId(provider.id, model) === modelId)
    );
};

const sanitizeDefaultMainModelIds = (
    state: ConfigState,
    rawDefaultModelIds: unknown,
    maxConcurrentMainModels: number,
    fallbackMainModelId: string
) => {
    const preferredModelIds = asStringArray(rawDefaultModelIds);
    if (preferredModelIds.length === 0) {
        preferredModelIds.push(fallbackMainModelId || DEFAULT_MODEL_ID);
    }

    const uniqueValidModelIds: string[] = [];
    for (const modelId of preferredModelIds) {
        if (uniqueValidModelIds.length >= maxConcurrentMainModels) break;
        if (!isModelIdAvailable(state, modelId) || uniqueValidModelIds.includes(modelId)) continue;
        uniqueValidModelIds.push(modelId);
    }

    for (const modelId of getAvailableModelIds(state)) {
        if (uniqueValidModelIds.length >= maxConcurrentMainModels) break;
        if (uniqueValidModelIds.includes(modelId)) continue;
        uniqueValidModelIds.push(modelId);
    }

    if (uniqueValidModelIds.length === 0) {
        uniqueValidModelIds.push(DEFAULT_MODEL_ID);
    }

    return uniqueValidModelIds.slice(0, maxConcurrentMainModels);
};

const normalizeMainModelSettings = (
    state: ConfigState,
    options?: {
        maxConcurrentMainModels?: unknown;
        defaultMainModelIds?: unknown;
        mainModelId?: string;
    }
) => {
    const nextMaxConcurrentMainModels = clampMainModelSlots(
        options?.maxConcurrentMainModels ?? state.maxConcurrentMainModels
    );
    const nextDefaultMainModelIds = sanitizeDefaultMainModelIds(
        state,
        options?.defaultMainModelIds ?? state.defaultMainModelIds,
        nextMaxConcurrentMainModels,
        options?.mainModelId ?? state.mainModelId
    );

    state.maxConcurrentMainModels = nextMaxConcurrentMainModels;
    state.defaultMainModelIds = nextDefaultMainModelIds;
    state.mainModelId = nextDefaultMainModelIds[0];
};

const ensureSelectedModels = (state: ConfigState) => {
    normalizeMainModelSettings(state);
    if (!isModelIdAvailable(state, state.subModelId)) {
        state.subModelId = DEFAULT_MODEL_ID;
    }
};

normalizeMainModelSettings(initialState, {
    maxConcurrentMainModels: saved.maxConcurrentMainModels,
    defaultMainModelIds: saved.defaultMainModelIds,
    mainModelId: saved.mainModelId ?? initialState.mainModelId,
});
ensureSelectedModels(initialState);

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setApiKey: (state, action: PayloadAction<{ providerId: string; apiKey: string }>) => {
            state.apiKeys[action.payload.providerId] = action.payload.apiKey;
            persistConfig(state);
        },
        setMainModel: (state, action: PayloadAction<string>) => {
            if (!isModelIdAvailable(state, action.payload)) return;
            state.defaultMainModelIds = [
                action.payload,
                ...state.defaultMainModelIds.filter((modelId) => modelId !== action.payload),
            ];
            normalizeMainModelSettings(state);
            persistConfig(state);
        },
        setMaxConcurrentMainModels: (state, action: PayloadAction<number>) => {
            normalizeMainModelSettings(state, {
                maxConcurrentMainModels: action.payload,
            });
            persistConfig(state);
        },
        setDefaultMainModelId: (
            state,
            action: PayloadAction<{ index: number; modelId: string }>
        ) => {
            const { index, modelId } = action.payload;
            if (index < 0 || index >= state.maxConcurrentMainModels) return;
            if (!isModelIdAvailable(state, modelId)) return;
            if (state.defaultMainModelIds.some((selectedModelId, selectedIndex) => selectedIndex !== index && selectedModelId === modelId)) {
                return;
            }
            state.defaultMainModelIds[index] = modelId;
            normalizeMainModelSettings(state);
            persistConfig(state);
        },
        setSubModel: (state, action: PayloadAction<string>) => {
            state.subModelId = action.payload;
            persistConfig(state);
        },
        setSubSessionContextMode: (state, action: PayloadAction<'new' | 'keep'>) => {
            state.subSessionContextMode = action.payload;
            persistConfig(state);
        },
        addCustomProvider: (state, action: PayloadAction<{ id?: string } | undefined>) => {
            const id = action.payload?.id || makeCustomProviderId('custom');
            state.customProviders.push({
                id,
                name: 'Custom Provider',
                baseUrl: '',
                apiKey: '',
                models: [],
            });
            persistConfig(state);
        },
        updateCustomProvider: (
            state,
            action: PayloadAction<{
                providerId: string;
                changes: Partial<Omit<CustomProviderConfig, 'id' | 'models'>>;
            }>
        ) => {
            const provider = state.customProviders.find((p) => p.id === action.payload.providerId);
            if (!provider) return;
            if (typeof action.payload.changes.name === 'string') {
                provider.name = action.payload.changes.name;
            }
            if (typeof action.payload.changes.baseUrl === 'string') {
                provider.baseUrl = action.payload.changes.baseUrl;
            }
            if (typeof action.payload.changes.apiKey === 'string') {
                provider.apiKey = action.payload.changes.apiKey;
            }
            persistConfig(state);
        },
        removeCustomProvider: (state, action: PayloadAction<{ providerId: string }>) => {
            state.customProviders = state.customProviders.filter((p) => p.id !== action.payload.providerId);
            ensureSelectedModels(state);
            persistConfig(state);
        },
        addCustomProviderModel: (state, action: PayloadAction<{ providerId: string }>) => {
            const provider = state.customProviders.find((p) => p.id === action.payload.providerId);
            if (!provider) return;
            provider.models.push('new-model');
            persistConfig(state);
        },
        updateCustomProviderModel: (
            state,
            action: PayloadAction<{ providerId: string; index: number; modelName: string }>
        ) => {
            const provider = state.customProviders.find((p) => p.id === action.payload.providerId);
            if (!provider || action.payload.index < 0 || action.payload.index >= provider.models.length) return;
            provider.models[action.payload.index] = action.payload.modelName;
            ensureSelectedModels(state);
            persistConfig(state);
        },
        removeCustomProviderModel: (
            state,
            action: PayloadAction<{ providerId: string; index: number }>
        ) => {
            const provider = state.customProviders.find((p) => p.id === action.payload.providerId);
            if (!provider) return;
            provider.models = provider.models.filter((_, idx) => idx !== action.payload.index);
            ensureSelectedModels(state);
            persistConfig(state);
        },
        moveCustomProviderModel: (
            state,
            action: PayloadAction<{ providerId: string; fromIndex: number; toIndex: number }>
        ) => {
            const { providerId, fromIndex, toIndex } = action.payload;
            const provider = state.customProviders.find((p) => p.id === providerId);
            if (!provider) return;
            if (
                fromIndex < 0 ||
                toIndex < 0 ||
                fromIndex >= provider.models.length ||
                toIndex >= provider.models.length ||
                fromIndex === toIndex
            ) {
                return;
            }
            const [movedModel] = provider.models.splice(fromIndex, 1);
            provider.models.splice(toIndex, 0, movedModel);
            persistConfig(state);
        },
        toggleSettings: (state) => {
            state.settingsOpen = !state.settingsOpen;
        },
        loadConfig: (state) => {
            const loaded = loadFromStorage();
            if (loaded.apiKeys) state.apiKeys = loaded.apiKeys;
            if (loaded.mainModelId) state.mainModelId = loaded.mainModelId;
            if (loaded.subModelId) state.subModelId = loaded.subModelId;
            if (loaded.subSessionContextMode) state.subSessionContextMode = loaded.subSessionContextMode;
            state.customProviders = sanitizeCustomProviders(loaded.customProviders);
            normalizeMainModelSettings(state, {
                maxConcurrentMainModels: loaded.maxConcurrentMainModels,
                defaultMainModelIds: loaded.defaultMainModelIds,
                mainModelId: loaded.mainModelId ?? state.mainModelId,
            });
            ensureSelectedModels(state);
        },
    },
});

function persistConfig(state: ConfigState) {
    try {
        const {
            apiKeys,
            mainModelId,
            maxConcurrentMainModels,
            defaultMainModelIds,
            subModelId,
            subSessionContextMode,
            customProviders,
        } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            apiKeys,
            mainModelId,
            maxConcurrentMainModels,
            defaultMainModelIds,
            subModelId,
            subSessionContextMode,
            customProviders,
        }));
    } catch { /* ignore */ }
}

export const {
    setApiKey,
    setMainModel,
    setMaxConcurrentMainModels,
    setDefaultMainModelId,
    setSubModel,
    setSubSessionContextMode,
    addCustomProvider,
    updateCustomProvider,
    removeCustomProvider,
    addCustomProviderModel,
    updateCustomProviderModel,
    removeCustomProviderModel,
    moveCustomProviderModel,
    toggleSettings,
    loadConfig,
} = configSlice.actions;
export default configSlice.reducer;
