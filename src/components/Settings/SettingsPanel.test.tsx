import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from '../../store/slices/sessionSlice';
import configReducer from '../../store/slices/configSlice';
import notesReducer from '../../store/slices/notesSlice';
import SettingsPanel, { SettingsPanelContent } from './SettingsPanel';

const createTestStore = () =>
    configureStore({
        reducer: {
            sessions: sessionReducer,
            config: configReducer,
            notes: notesReducer,
        },
        preloadedState: {
            config: {
                apiKeys: {},
                mainModelId: 'MiniMax-M2.5',
                maxConcurrentMainModels: 2,
                defaultMainModelIds: ['MiniMax-M2.5', 'deepseek-chat'],
                subModelId: 'gpt-4o',
                subSessionContextMode: 'keep' as const,
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
        },
    });

describe('SettingsPanel tabbed layout', () => {
    it('shows Models as the default tab on the connected panel', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanel />
            </Provider>
        );

        expect(html).toContain('settings-tab is-active');
        expect(html).toContain('role="tab" aria-selected="true" class="settings-tab is-active">Models<');
        expect(html).toContain('Main Window Concurrent Models');
        expect(html).not.toContain('Built-in Provider API Keys');
    });

    it('renders provider settings only in the Providers tab content', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activeTab="providers" />
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
                <SettingsPanelContent activeTab="models" />
            </Provider>
        );

        expect(html).toContain('Choose the default model mix for the main chat and sub-threads.');
        expect(html).toContain('Recommended');
    });

    it('filters provider content when a provider query is supplied', () => {
        const html = renderToStaticMarkup(
            <Provider store={createTestStore()}>
                <SettingsPanelContent activeTab="providers" providerQuery="nvidia" />
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
                    activeTab="providers"
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
                <SettingsPanelContent activeTab="advanced" />
            </Provider>
        );

        expect(html).toContain('Sub-Session Context Mode');
        expect(html).toContain('Controls how new sub-threads inherit context');
        expect(html).toContain('reuses the current thread history before branching.');
        expect(html).not.toContain('Built-in Provider API Keys');
        expect(html).not.toContain('Default Main Models');
    });
});
