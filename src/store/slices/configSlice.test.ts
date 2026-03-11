import { afterEach, describe, expect, it, vi } from 'vitest';
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from '../../utils/models';

const STORAGE_KEY = 'threadnote_ai_config';

type LocalStorageMock = {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
};

const createLocalStorage = (savedConfig?: unknown): { storage: Record<string, string>; mock: LocalStorageMock } => {
    const storage: Record<string, string> = {};
    if (savedConfig !== undefined) {
        storage[STORAGE_KEY] = JSON.stringify(savedConfig);
    }

    const mock: LocalStorageMock = {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            storage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete storage[key];
        }),
        clear: vi.fn(() => {
            Object.keys(storage).forEach((key) => delete storage[key]);
        }),
    };

    return { storage, mock };
};

const loadConfigSlice = async (savedConfig?: unknown) => {
    vi.resetModules();
    const { storage, mock } = createLocalStorage(savedConfig);
    vi.stubGlobal('localStorage', mock);

    const mod = await import('./configSlice');
    return {
        reducer: mod.default,
        storage,
    };
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe('configSlice multi-model settings', () => {
    it('initializes new fields from legacy storage data', async () => {
        const { reducer } = await loadConfigSlice({
            mainModelId: 'deepseek-chat',
            subModelId: 'gpt-4o',
        });

        const state = reducer(undefined, { type: '@@INIT' });

        expect(state.maxConcurrentMainModels).toBe(3);
        expect(state.defaultMainModelIds.length).toBe(3);
        expect(state.defaultMainModelIds[0]).toBe('deepseek-chat');
    });

    it('sanitizes saved values for max/default main models', async () => {
        const { reducer } = await loadConfigSlice({
            mainModelId: 'missing-model',
            maxConcurrentMainModels: 9,
            defaultMainModelIds: ['missing-model', 'deepseek-chat', 'deepseek-chat'],
        });

        const state = reducer(undefined, { type: '@@INIT' });

        expect(state.maxConcurrentMainModels).toBe(3);
        expect(state.defaultMainModelIds.length).toBe(3);
        expect(new Set(state.defaultMainModelIds).size).toBe(3);
        state.defaultMainModelIds.forEach((modelId: string) => {
            expect(AVAILABLE_MODELS.some((m) => m.id === modelId)).toBe(true);
        });
    });

    it('caps slot count and persists when max concurrent changes', async () => {
        const { reducer, storage } = await loadConfigSlice({
            maxConcurrentMainModels: 3,
            defaultMainModelIds: [DEFAULT_MODEL_ID, 'deepseek-chat', 'gpt-4o'],
        });

        const start = reducer(undefined, { type: '@@INIT' });
        const next = reducer(start, {
            type: 'config/setMaxConcurrentMainModels',
            payload: 2,
        });

        expect(next.maxConcurrentMainModels).toBe(2);
        expect(next.defaultMainModelIds).toEqual([DEFAULT_MODEL_ID, 'deepseek-chat']);
        expect(next.mainModelId).toBe(DEFAULT_MODEL_ID);

        const persisted = JSON.parse(storage[STORAGE_KEY]);
        expect(persisted.maxConcurrentMainModels).toBe(2);
        expect(persisted.defaultMainModelIds).toEqual([DEFAULT_MODEL_ID, 'deepseek-chat']);
    });

    it('rejects duplicate/invalid slot selection and syncs mainModelId from slot 1', async () => {
        const { reducer, storage } = await loadConfigSlice({
            maxConcurrentMainModels: 2,
            defaultMainModelIds: [DEFAULT_MODEL_ID, 'deepseek-chat'],
        });

        const start = reducer(undefined, { type: '@@INIT' });

        const duplicateAttempt = reducer(start, {
            type: 'config/setDefaultMainModelId',
            payload: { index: 1, modelId: DEFAULT_MODEL_ID },
        });
        expect(duplicateAttempt.defaultMainModelIds).toEqual([DEFAULT_MODEL_ID, 'deepseek-chat']);

        const invalidAttempt = reducer(start, {
            type: 'config/setDefaultMainModelId',
            payload: { index: 1, modelId: 'unknown-model' },
        });
        expect(invalidAttempt.defaultMainModelIds).toEqual([DEFAULT_MODEL_ID, 'deepseek-chat']);

        const validUpdate = reducer(start, {
            type: 'config/setDefaultMainModelId',
            payload: { index: 0, modelId: 'gpt-4o' },
        });

        expect(validUpdate.defaultMainModelIds).toEqual(['gpt-4o', 'deepseek-chat']);
        expect(validUpdate.mainModelId).toBe('gpt-4o');

        const persisted = JSON.parse(storage[STORAGE_KEY]);
        expect(persisted.defaultMainModelIds).toEqual(['gpt-4o', 'deepseek-chat']);
        expect(persisted.mainModelId).toBe('gpt-4o');
    });

    it('defaults themeEffect to light and persists valid theme updates', async () => {
        const { reducer, storage } = await loadConfigSlice();

        const start = reducer(undefined, { type: '@@INIT' });
        expect(start.themeEffect).toBe('light');

        const next = reducer(start, {
            type: 'config/setThemeEffect',
            payload: 'dark',
        });

        expect(next.themeEffect).toBe('dark');

        const persisted = JSON.parse(storage[STORAGE_KEY]);
        expect(persisted.themeEffect).toBe('dark');
        expect(persisted.settingsOpen).toBeUndefined();
    });

    it('sanitizes invalid saved themeEffect values on load', async () => {
        const { reducer } = await loadConfigSlice({
            themeEffect: 'neon',
        });

        const state = reducer(undefined, { type: '@@INIT' });

        expect(state.themeEffect).toBe('light');
    });

    it('replaces AI config state from an imported payload without reopening settings', async () => {
        const { reducer } = await loadConfigSlice();

        const start = reducer(undefined, { type: '@@INIT' });
        const next = reducer(start, {
            type: 'config/replaceAiConfig',
            payload: {
                apiKeys: { openai: 'sk-test' },
                mainModelId: 'deepseek-chat',
                maxConcurrentMainModels: 1,
                defaultMainModelIds: ['deepseek-chat'],
                subModelId: 'gpt-4o',
                subSessionContextMode: 'keep',
                customProviders: [],
                themeEffect: 'dark',
                settingsOpen: true,
            },
        });

        expect(next.apiKeys).toEqual({ openai: 'sk-test' });
        expect(next.mainModelId).toBe('deepseek-chat');
        expect(next.defaultMainModelIds).toEqual(['deepseek-chat']);
        expect(next.subSessionContextMode).toBe('keep');
        expect(next.settingsOpen).toBe(false);
        expect(next.themeEffect).toBe('light');
    });
});
