import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConfigState {
    apiKeys: Record<string, string>;   // providerId → apiKey
    mainModelId: string;               // default model for main thread
    subModelId: string;                // default model for sub-thread
    settingsOpen: boolean;
}

const STORAGE_KEY = 'wrapperai_config';

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
    mainModelId: saved.mainModelId ?? 'MiniMax-M2.5',
    subModelId: saved.subModelId ?? 'MiniMax-M2.5',
    settingsOpen: false,
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
        toggleSettings: (state) => {
            state.settingsOpen = !state.settingsOpen;
        },
        loadConfig: (state) => {
            const loaded = loadFromStorage();
            if (loaded.apiKeys) state.apiKeys = loaded.apiKeys;
            if (loaded.mainModelId) state.mainModelId = loaded.mainModelId;
            if (loaded.subModelId) state.subModelId = loaded.subModelId;
        },
    },
});

function persistConfig(state: ConfigState) {
    try {
        const { apiKeys, mainModelId, subModelId } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKeys, mainModelId, subModelId }));
    } catch { /* ignore */ }
}

export const { setApiKey, setMainModel, setSubModel, toggleSettings, loadConfig } = configSlice.actions;
export default configSlice.reducer;
