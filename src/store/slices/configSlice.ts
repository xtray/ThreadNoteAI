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
    subModelId: string;                // default model for sub-thread
    subSessionContextMode: 'new' | 'keep';
    customProviders: CustomProviderConfig[];
    settingsOpen: boolean;
}

const STORAGE_KEY = 'threadnote_ai_config';

const loadFromStorage = (): Partial<ConfigState> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
};

const saved = loadFromStorage();

const initialState: ConfigState = {
    apiKeys: saved.apiKeys ?? {},
    mainModelId: saved.mainModelId ?? DEFAULT_MODEL_ID,
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

const ensureSelectedModels = (state: ConfigState) => {
    if (!isModelIdAvailable(state, state.mainModelId)) {
        state.mainModelId = DEFAULT_MODEL_ID;
    }
    if (!isModelIdAvailable(state, state.subModelId)) {
        state.subModelId = DEFAULT_MODEL_ID;
    }
};

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setApiKey: (state, action: PayloadAction<{ providerId: string; apiKey: string }>) => {
            state.apiKeys[action.payload.providerId] = action.payload.apiKey;
            persistConfig(state);
        },
        setMainModel: (state, action: PayloadAction<string>) => {
            state.mainModelId = action.payload;
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
            ensureSelectedModels(state);
        },
    },
});

function persistConfig(state: ConfigState) {
    try {
        const { apiKeys, mainModelId, subModelId, subSessionContextMode, customProviders } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            apiKeys,
            mainModelId,
            subModelId,
            subSessionContextMode,
            customProviders,
        }));
    } catch { /* ignore */ }
}

export const {
    setApiKey,
    setMainModel,
    setSubModel,
    setSubSessionContextMode,
    addCustomProvider,
    updateCustomProvider,
    removeCustomProvider,
    addCustomProviderModel,
    updateCustomProviderModel,
    removeCustomProviderModel,
    toggleSettings,
    loadConfig,
} = configSlice.actions;
export default configSlice.reducer;
