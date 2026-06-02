import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    addCustomProvider,
    addCustomProviderModel,
    moveCustomProviderModel,
    removeCustomProvider,
    removeCustomProviderModel,
    setApiKey,
    setDefaultMainModelId,
    setMaxConcurrentMainModels,
    setSubSessionContextMode,
    setSubModel,
    setThemeEffect,
    toggleSettings,
    updateCustomProvider,
    updateCustomProviderModel,
} from '../../store/slices/configSlice';
import { SUPPORTED_PROVIDERS, AVAILABLE_MODELS } from '../../utils/models';
import { getCustomModelOptions } from '../../utils/customModels';
import { X, Eye, EyeOff, Plus, Trash2, GripVertical, ChevronRight, Search } from 'lucide-react';
import NotebookSettingsSection from './NotebookSettingsSection';
import AiDataSettingsSection from './AiDataSettingsSection';

export type SettingsPrimaryTabId = 'general' | 'ai' | 'notebook';
export type SettingsAiTabId = 'models' | 'providers' | 'advanced' | 'data';

const SETTINGS_PRIMARY_TABS: Array<{ id: SettingsPrimaryTabId; label: string }> = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI' },
    { id: 'notebook', label: 'Notebook' },
];

const SETTINGS_AI_TABS: Array<{ id: SettingsAiTabId; label: string }> = [
    { id: 'models', label: 'Models' },
    { id: 'providers', label: 'Providers' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'data', label: 'Data' },
];

export const SettingsPanelContent: React.FC<{
    activePrimaryTab: SettingsPrimaryTabId;
    activeAiTab: SettingsAiTabId;
    notebookSettingsProps?: React.ComponentProps<typeof NotebookSettingsSection>;
    aiDataSettingsProps?: React.ComponentProps<typeof AiDataSettingsSection>;
    providerQuery?: string;
    collapsedProviderIds?: Set<string>;
    onProviderQueryChange?: (value: string) => void;
    onToggleProviderCollapse?: (providerId: string) => void;
}> = ({
    activePrimaryTab,
    activeAiTab,
    notebookSettingsProps,
    aiDataSettingsProps,
    providerQuery = '',
    collapsedProviderIds,
    onProviderQueryChange,
    onToggleProviderCollapse,
}) => {
    const dispatch = useDispatch();
    const config = useSelector((state: RootState) => state.config);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const [draggingModel, setDraggingModel] = useState<{ providerId: string; index: number } | null>(null);
    const [dragOverModel, setDragOverModel] = useState<{ providerId: string; index: number } | null>(null);
    const customModels = getCustomModelOptions(config.customProviders);
    const normalizedProviderQuery = providerQuery.trim().toLowerCase();
    const filteredBuiltInProviders = normalizedProviderQuery
        ? SUPPORTED_PROVIDERS.filter((provider) => provider.name.toLowerCase().includes(normalizedProviderQuery))
        : SUPPORTED_PROVIDERS;
    const filteredCustomProviders = normalizedProviderQuery
        ? config.customProviders.filter((provider) => {
            if (provider.name.toLowerCase().includes(normalizedProviderQuery)) return true;
            return provider.models.some((modelName) => modelName.toLowerCase().includes(normalizedProviderQuery));
        })
        : config.customProviders;
    const providerMatchCount = filteredBuiltInProviders.length + filteredCustomProviders.length;

    const toggleKeyVisibility = (providerId: string) => {
        setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
    };

    const isModelFilled = (modelName: string) => modelName.trim().length > 0;

    const handleModelDragStart = (
        providerId: string,
        index: number,
        modelName: string,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        if (!isModelFilled(modelName)) {
            event.preventDefault();
            return;
        }
        setDraggingModel({ providerId, index });
        setDragOverModel(null);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${providerId}:${index}`);
    };

    const handleModelDragOver = (
        providerId: string,
        index: number,
        modelName: string,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        if (
            !draggingModel ||
            draggingModel.providerId !== providerId ||
            draggingModel.index === index ||
            !isModelFilled(modelName)
        ) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (!dragOverModel || dragOverModel.providerId !== providerId || dragOverModel.index !== index) {
            setDragOverModel({ providerId, index });
        }
    };

    const handleModelDrop = (
        providerId: string,
        index: number,
        modelName: string,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        event.preventDefault();
        if (
            !draggingModel ||
            draggingModel.providerId !== providerId ||
            draggingModel.index === index ||
            !isModelFilled(modelName)
        ) {
            setDragOverModel(null);
            return;
        }
        dispatch(moveCustomProviderModel({
            providerId,
            fromIndex: draggingModel.index,
            toIndex: index,
        }));
        setDraggingModel(null);
        setDragOverModel(null);
    };

    const handleModelDragEnd = () => {
        setDraggingModel(null);
        setDragOverModel(null);
    };

    if (activePrimaryTab === 'general') {
        return (
            <div className="settings-tab-panel" data-settings-primary-tab="general">
                <section className="settings-section">
                    <div className="settings-info-card">
                        <strong>Global Preferences</strong>
                        <p>Set app-wide options here. Theme selection is stored now and can power real themes later.</p>
                    </div>
                    <h3>Appearance</h3>
                    <div className="settings-field">
                        <label>Theme Effect</label>
                        <p className="settings-field-hint">
                            Dummy setting for now. It saves your choice but does not change the page theme yet.
                        </p>
                        <select
                            value={config.themeEffect}
                            onChange={(e) => dispatch(setThemeEffect(e.target.value as 'light' | 'dark'))}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </section>
            </div>
        );
    }

    if (activePrimaryTab === 'notebook') {
        return <NotebookSettingsSection {...notebookSettingsProps} />;
    }

    if (activeAiTab === 'models') {
        return (
            <div className="settings-tab-panel" data-settings-tab="models">
                <section className="settings-section">
                    <div className="settings-info-card">
                        <strong>Model Defaults</strong>
                        <p>Choose the default model mix for the main chat and sub-threads.</p>
                    </div>
                    <h3>Model Configuration</h3>

                    <div className="settings-field">
                        <label>Main Window Concurrent Models</label>
                        <p className="settings-field-hint">
                            Recommended: keep this at `2` or `3` only when you want side-by-side comparisons.
                        </p>
                        <select
                            value={config.maxConcurrentMainModels}
                            onChange={(e) => dispatch(setMaxConcurrentMainModels(Number(e.target.value)))}
                        >
                            {[1, 2, 3].map((count) => (
                                <option key={count} value={count}>
                                    {count}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="settings-field">
                        <label>Default Main Models</label>
                        <p className="settings-field-hint">
                            Slot 1 acts as the primary default. Add a second or third slot only for deliberate multi-model use.
                        </p>
                        <div className="custom-model-list">
                            {Array.from({ length: config.maxConcurrentMainModels }, (_, slotIndex) => {
                                const selectedId = config.defaultMainModelIds[slotIndex] ?? '';
                                const selectedInOtherSlots = new Set(
                                    config.defaultMainModelIds.filter((modelId, index) => index !== slotIndex && modelId)
                                );

                                return (
                                    <div key={`main-model-slot-${slotIndex}`} className="custom-model-row">
                                        <label>{`Slot ${slotIndex + 1}`}</label>
                                        <select
                                            value={selectedId}
                                            onChange={(e) =>
                                                dispatch(setDefaultMainModelId({
                                                    index: slotIndex,
                                                    modelId: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">No model</option>
                                            <optgroup label="Built-in">
                                                {AVAILABLE_MODELS.map((m) => (
                                                    <option
                                                        key={m.id}
                                                        value={m.id}
                                                        disabled={selectedInOtherSlots.has(m.id)}
                                                    >
                                                        {m.displayName}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            {customModels.length > 0 && (
                                                <optgroup label="Custom">
                                                    {customModels.map((m) => (
                                                        <option
                                                            key={m.id}
                                                            value={m.id}
                                                            disabled={selectedInOtherSlots.has(m.id)}
                                                        >
                                                            {m.displayName}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="settings-field">
                        <label>Sub-thread Model</label>
                        <p className="settings-field-hint">
                            Use a lighter model here if sub-threads are mostly exploratory.
                        </p>
                        <select
                            value={config.subModelId}
                            onChange={(e) => dispatch(setSubModel(e.target.value))}
                        >
                            <optgroup label="Built-in">
                                {AVAILABLE_MODELS.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.displayName}
                                    </option>
                                ))}
                            </optgroup>
                            {customModels.length > 0 && (
                                <optgroup label="Custom">
                                    {customModels.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.displayName}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                </section>
            </div>
        );
    }

    if (activeAiTab === 'providers') {
        return (
            <div className="settings-tab-panel" data-settings-tab="providers">
                <section className="settings-section">
                    <div className="settings-search-row">
                        <div className="settings-search-header">
                            <label className="settings-search-label" htmlFor="provider-search">Provider Search</label>
                            {normalizedProviderQuery && (
                                <span className="settings-search-count">
                                    {providerMatchCount} match{providerMatchCount === 1 ? '' : 'es'}
                                </span>
                            )}
                        </div>
                        <div className="settings-search-input-wrap">
                            <Search size={16} className="settings-search-icon" />
                            <input
                                className="settings-search-input"
                                id="provider-search"
                                type="text"
                                value={providerQuery}
                                onChange={(event) => onProviderQueryChange?.(event.target.value)}
                                placeholder="Search provider or model"
                            />
                            {normalizedProviderQuery && (
                                <button
                                    type="button"
                                    className="settings-search-clear"
                                    onClick={() => onProviderQueryChange?.('')}
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    </div>
                    <h3>Built-in Provider API Keys</h3>
                    {filteredBuiltInProviders.map((provider) => (
                        <div className="built-in-provider-card" key={provider.id}>
                            <div className="settings-field">
                                <label>{provider.name}</label>
                                <div className="key-input-row">
                                    <input
                                        className="provider-control-input"
                                        type={visibleKeys[provider.id] ? 'text' : 'password'}
                                        value={config.apiKeys[provider.id] || ''}
                                        onChange={(e) =>
                                            dispatch(setApiKey({ providerId: provider.id, apiKey: e.target.value }))
                                        }
                                        placeholder={`Enter ${provider.name} API Key`}
                                    />
                                    <button
                                        className="toggle-key-btn provider-action-btn"
                                        onClick={() => toggleKeyVisibility(provider.id)}
                                    >
                                        {visibleKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="settings-section">
                    <div className="settings-inline-header">
                        <h3>Custom Providers</h3>
                        <button
                            className="inline-add-btn provider-action-btn"
                            onClick={() => dispatch(addCustomProvider(undefined))}
                        >
                            <Plus size={14} />
                            <span>Add Provider</span>
                        </button>
                    </div>
                    {filteredCustomProviders.length === 0 && (
                        <p className="settings-hint">
                            {normalizedProviderQuery
                                ? 'No custom providers match the current search.'
                                : 'Add custom OpenAI-compatible providers (for example, NVIDIA) with Base URL, API key and model names.'}
                        </p>
                    )}
                    {filteredCustomProviders.map((provider) => {
                        const matchesSearch = normalizedProviderQuery.length > 0;
                        const isCollapsed = matchesSearch ? false : collapsedProviderIds?.has(provider.id) ?? false;
                        const modelCount = provider.models.length;
                        const summary = `${modelCount} model${modelCount === 1 ? '' : 's'}${provider.baseUrl ? ' · Base URL set' : ''}`;

                        return (
                            <div className={`custom-provider-card ${isCollapsed ? 'is-collapsed' : ''}`} key={provider.id}>
                                <div className="custom-provider-head">
                                    <button
                                        type="button"
                                        className="custom-provider-summary"
                                        onClick={() => onToggleProviderCollapse?.(provider.id)}
                                    >
                                        <span className="custom-provider-toggle" aria-hidden="true">
                                            <ChevronRight size={14} />
                                        </span>
                                        <span>
                                            <strong>{provider.name || 'Custom Provider'}</strong>
                                            <span className="custom-provider-meta">{summary}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-danger-btn provider-action-btn"
                                        onClick={() => dispatch(removeCustomProvider({ providerId: provider.id }))}
                                        title="Remove provider"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {!isCollapsed && (
                                    <>
                                        <div className="settings-field">
                                            <label>Provider Name</label>
                                            <input
                                                className="provider-control-input"
                                                type="text"
                                                value={provider.name}
                                                onChange={(e) =>
                                                    dispatch(updateCustomProvider({
                                                        providerId: provider.id,
                                                        changes: { name: e.target.value },
                                                    }))
                                                }
                                                placeholder="e.g. NVIDIA"
                                            />
                                        </div>

                                        <div className="settings-field">
                                            <label>Base URL</label>
                                            <input
                                                className="provider-control-input"
                                                type="text"
                                                value={provider.baseUrl}
                                                onChange={(e) =>
                                                    dispatch(updateCustomProvider({
                                                        providerId: provider.id,
                                                        changes: { baseUrl: e.target.value },
                                                    }))
                                                }
                                                placeholder="e.g. https://integrate.api.nvidia.com/v1"
                                            />
                                        </div>

                                        <div className="settings-field">
                                            <label>API Key</label>
                                            <div className="key-input-row">
                                                <input
                                                    className="provider-control-input"
                                                    type={visibleKeys[provider.id] ? 'text' : 'password'}
                                                    value={provider.apiKey}
                                                    onChange={(e) =>
                                                        dispatch(updateCustomProvider({
                                                            providerId: provider.id,
                                                            changes: { apiKey: e.target.value },
                                                        }))
                                                    }
                                                    placeholder="Enter API key"
                                                />
                                                <button
                                                    type="button"
                                                    className="toggle-key-btn provider-action-btn"
                                                    onClick={() => toggleKeyVisibility(provider.id)}
                                                >
                                                    {visibleKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="settings-field">
                                            <label>Models</label>
                                            <div className="custom-model-list">
                                                {provider.models.map((modelName, index) => (
                                                    <div
                                                        key={`${provider.id}-${index}`}
                                                        className={`custom-model-row ${isModelFilled(modelName) ? 'is-draggable' : ''} ${dragOverModel?.providerId === provider.id && dragOverModel.index === index ? 'is-drop-target' : ''} ${draggingModel?.providerId === provider.id && draggingModel.index === index ? 'is-dragging' : ''}`}
                                                        draggable={isModelFilled(modelName)}
                                                        onDragStart={(event) => handleModelDragStart(provider.id, index, modelName, event)}
                                                        onDragOver={(event) => handleModelDragOver(provider.id, index, modelName, event)}
                                                        onDrop={(event) => handleModelDrop(provider.id, index, modelName, event)}
                                                        onDragEnd={handleModelDragEnd}
                                                        title={isModelFilled(modelName) ? 'Drag to reorder' : 'Enter model name first'}
                                                    >
                                                        <span className="custom-model-drag-handle" aria-hidden="true">
                                                            <GripVertical size={14} />
                                                        </span>
                                                        <input
                                                            className="provider-control-input"
                                                            type="text"
                                                            value={modelName}
                                                            onChange={(e) =>
                                                                dispatch(updateCustomProviderModel({
                                                                    providerId: provider.id,
                                                                    index,
                                                                    modelName: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="e.g. meta/llama-3.1-70b-instruct"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="inline-danger-btn provider-action-btn"
                                                            onClick={() =>
                                                                dispatch(removeCustomProviderModel({ providerId: provider.id, index }))
                                                            }
                                                            title="Remove model"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                className="inline-add-btn compact provider-action-btn"
                                                onClick={() => dispatch(addCustomProviderModel({ providerId: provider.id }))}
                                            >
                                                <Plus size={14} />
                                                <span>Add Model</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </section>
            </div>
        );
    }

    if (activeAiTab === 'advanced') {
        return (
            <div className="settings-tab-panel" data-settings-tab="advanced">
                <section className="settings-section">
                    <div className="settings-info-card">
                        <strong>Lower-Frequency Controls</strong>
                        <p>Use this area for behavior tuning that affects branching and context carry-over.</p>
                    </div>
                    <h3>Advanced</h3>
                    <p className="settings-hint settings-advanced-hint">
                        Controls how new sub-threads inherit context from the current conversation.
                    </p>
                    <div className="settings-field">
                        <label>Sub-Session Context Mode</label>
                        <div className="settings-option-help">
                            <div><strong>New</strong> starts the sub-thread with only the anchor context.</div>
                            <div><strong>Keep</strong> reuses the current thread history before branching.</div>
                        </div>
                        <select
                            value={config.subSessionContextMode}
                            onChange={(e) => dispatch(setSubSessionContextMode(e.target.value as 'new' | 'keep'))}
                        >
                            <option value="new">New</option>
                            <option value="keep">Keep</option>
                        </select>
                    </div>
                </section>
            </div>
        );
    }

    return <AiDataSettingsSection {...aiDataSettingsProps} />;
};

const SettingsPanel: React.FC<{
    initialPrimaryTab?: SettingsPrimaryTabId;
    initialAiTab?: SettingsAiTabId;
    notebookSettingsProps?: React.ComponentProps<typeof NotebookSettingsSection>;
    aiDataSettingsProps?: React.ComponentProps<typeof AiDataSettingsSection>;
}> = ({
    initialPrimaryTab = 'general',
    initialAiTab = 'models',
    notebookSettingsProps,
    aiDataSettingsProps,
}) => {
    const dispatch = useDispatch();
    const config = useSelector((state: RootState) => state.config);
    const [activePrimaryTab, setActivePrimaryTab] = useState<SettingsPrimaryTabId>(initialPrimaryTab);
    const [activeAiTab, setActiveAiTab] = useState<SettingsAiTabId>(initialAiTab);
    const [providerQuery, setProviderQuery] = useState('');
    const [collapsedProviderIds, setCollapsedProviderIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setActivePrimaryTab(initialPrimaryTab);
    }, [initialPrimaryTab]);

    useEffect(() => {
        setActiveAiTab(initialAiTab);
    }, [initialAiTab]);

    if (!config.settingsOpen) return null;

    return (
        <div className="settings-backdrop" onClick={() => dispatch(toggleSettings())}>
            <div className="settings-panel settings-panel-unified" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="settings-close" onClick={() => dispatch(toggleSettings())}>
                        <X size={18} />
                    </button>
                </div>
                <div className="settings-layout">
                    <div className="settings-primary-tabs" role="tablist" aria-label="Settings sections">
                        {SETTINGS_PRIMARY_TABS.map((tab) => {
                            const isActive = tab.id === activePrimaryTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`settings-primary-tab ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setActivePrimaryTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="settings-content-column">
                        {activePrimaryTab === 'ai' && (
                            <div className="settings-tabs" role="tablist" aria-label="AI settings categories">
                                {SETTINGS_AI_TABS.map((tab) => {
                                    const isActive = tab.id === activeAiTab;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            className={`settings-tab ${isActive ? 'is-active' : ''}`}
                                            onClick={() => setActiveAiTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="settings-body">
                            <SettingsPanelContent
                                activePrimaryTab={activePrimaryTab}
                                activeAiTab={activeAiTab}
                                notebookSettingsProps={notebookSettingsProps}
                                aiDataSettingsProps={aiDataSettingsProps}
                                providerQuery={providerQuery}
                                collapsedProviderIds={collapsedProviderIds}
                                onProviderQueryChange={setProviderQuery}
                                onToggleProviderCollapse={(providerId) => {
                                    setCollapsedProviderIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(providerId)) {
                                            next.delete(providerId);
                                        } else {
                                            next.add(providerId);
                                        }
                                        return next;
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
