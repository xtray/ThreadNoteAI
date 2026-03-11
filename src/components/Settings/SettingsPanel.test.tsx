import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../store/slices/sessionSlice';
import configReducer from '../../store/slices/configSlice';
import notesReducer from '../../store/slices/notesSlice';
import SettingsPanel, { SettingsPanelContent } from './SettingsPanel';

const createPreloadedState = () => ({
    config: {
        apiKeys: {},
        mainModelId: 'MiniMax-M2.5',
        maxConcurrentMainModels: 2,
        defaultMainModelIds: ['MiniMax-M2.5', 'deepseek-chat'],
        subModelId: 'gpt-4o',
        subSessionContextMode: 'keep' as const,
        themeEffect: 'light' as const,
        customProviders: [
            {
                id: 'custom-provider-1',
                name: 'NVIDIA',
                baseUrl: 'https://integrate.api.nvidia.com/v1',
                apiKey: 'secret',
                models: ['meta/llama-3.1-70b-instruct'],
            },
        ],
        settingsOpen: true,
    },
});

const createTestStore = (preloadedState = createPreloadedState()) =>
    configureStore({
        reducer: {
            sessions: sessionReducer,
            config: configReducer,
            notes: notesReducer,
        },
        preloadedState,
    });

describe('SettingsPanel tabbed layout', () => {
    it('shows General as the default primary tab on the connected panel', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanel />
            </Provider>
        );

        expect(html).toContain('settings-primary-tab is-active');
        expect(html).toContain('Theme Effect');
        expect(html).toContain('Light');
        expect(html).not.toContain('Main Window Concurrent Models');
    });

    it('renders primary settings navigation with General, AI, and Notebook', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanel />
            </Provider>
        );

        expect(html).toContain('General');
        expect(html).toContain('AI');
        expect(html).toContain('Notebook');
    });

    it('renders provider settings only in the Providers tab content', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activePrimaryTab="ai" activeAiTab="providers" />
            </Provider>
        );

        expect(html).toContain('Built-in Provider API Keys');
        expect(html).toContain('Custom Providers');
        expect(html).toContain('NVIDIA');
        expect(html).not.toContain('Main Window Concurrent Models');
        expect(html).not.toContain('Sub-Session Context Mode');
        expect(html).toContain('provider-control-input');
        expect(html).toContain('provider-action-btn');
        expect(html).toContain('built-in-provider-card');
    });

    it('renders models guidance copy in the Models tab content', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activePrimaryTab="ai" activeAiTab="models" />
            </Provider>
        );

        expect(html).toContain('Choose the default model mix for the main chat and sub-threads.');
        expect(html).toContain('Recommended');
    });

    it('filters provider content when a provider query is supplied', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activePrimaryTab="ai" activeAiTab="providers" providerQuery="nvidia" />
            </Provider>
        );

        expect(html).toContain('NVIDIA');
        expect(html).not.toContain('MiniMax');
        expect(html).toContain('Provider Search');
        expect(html).toContain('1 match');
        expect(html).toContain('Clear search');
        expect(html).toContain('settings-search-icon');
        expect(html).toContain('class="settings-search-input"');
        expect(html).toContain('class="settings-search-clear"');
    });

    it('renders a collapsed custom provider summary when requested', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent
                    activePrimaryTab="ai"
                    activeAiTab="providers"
                    collapsedProviderIds={new Set(['custom-provider-1'])}
                />
            </Provider>
        );

        expect(html).toContain('1 model');
        expect(html).not.toContain('<label>Base URL</label>');
        expect(html).not.toContain('Enter API key');
    });

    it('renders advanced settings only in the Advanced tab content', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activePrimaryTab="ai" activeAiTab="advanced" />
            </Provider>
        );

        expect(html).toContain('Sub-Session Context Mode');
        expect(html).toContain('Controls how new sub-threads inherit context');
        expect(html).toContain('reuses the current thread history before branching.');
        expect(html).not.toContain('Built-in Provider API Keys');
        expect(html).not.toContain('Default Main Models');
    });

    it('shows AI secondary tabs when AI is the active primary tab', () => {
        const preloadedState = createPreloadedState();
        const html = renderToStaticMarkup(
            <Provider store={createTestStore({
                    ...preloadedState,
                })}>
                <SettingsPanel initialPrimaryTab="ai" initialAiTab="models" />
            </Provider>
        );

        expect(html).toContain('Models');
        expect(html).toContain('Providers');
        expect(html).toContain('Advanced');
        expect(html).toContain('Data');
        expect(html).toContain('Main Window Concurrent Models');
    });

    it('renders notebook import and export actions in the Notebook page', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanel initialPrimaryTab="notebook" />
            </Provider>
        );

        expect(html).toContain('Export All Notes to Directory');
        expect(html).toContain('Import Notes from Export File');
    });

    it('renders AI data actions in the Data tab', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanel initialPrimaryTab="ai" initialAiTab="data" />
            </Provider>
        );

        expect(html).toContain('Export Models &amp; Providers Configuration');
        expect(html).toContain('Import Models &amp; Providers Configuration');
        expect(html).toContain('Export All AI Chats');
        expect(html).toContain('Overwrite current chats');
        expect(html).toContain('Merge into current chats');
    });
});
