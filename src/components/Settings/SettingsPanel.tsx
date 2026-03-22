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
    setLanguage,
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
import { getProvisionedModelOptions } from '../../utils/modelDisplay';
import { getAppText } from '../../i18n/text';
import { X, Eye, EyeOff, Plus, Trash2, GripVertical, ChevronRight, Search } from 'lucide-react';
import NotebookSettingsSection from './NotebookSettingsSection';
import AiDataSettingsSection from './AiDataSettingsSection';

export type SettingsPrimaryTabId = 'general' | 'ai' | 'notebook';
export type SettingsAiTabId = 'models' | 'providers' | 'advanced' | 'data';

const SETTINGS_PRIMARY_TABS: SettingsPrimaryTabId[] = ['general', 'ai', 'notebook'];
const SETTINGS_AI_TABS: SettingsAiTabId[] = ['models', 'providers', 'advanced', 'data'];

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
    const text = getAppText(config.language);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const [draggingModel, setDraggingModel] = useState<{ providerId: string; index: number } | null>(null);
    const [dragOverModel, setDragOverModel] = useState<{ providerId: string; index: number } | null>(null);
    const customModels = getCustomModelOptions(config.customProviders);
    const provisionedModelOptions = getProvisionedModelOptions({
        apiKeys: config.apiKeys,
        customProviders: config.customProviders,
    });
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
                        <strong>{text.globalPreferencesTitle}</strong>
                        <p>{text.globalPreferencesHint}</p>
                    </div>
                    <h3>{text.appearance}</h3>
                    <div className="settings-field">
                        <label>{text.language}</label>
                        <select
                            value={config.language}
                            onChange={(e) => dispatch(setLanguage(e.target.value as 'en' | 'zh'))}
                        >
                            <option value="en">{text.english}</option>
                            <option value="zh">{text.chinese}</option>
                        </select>
                    </div>
                    <div className="settings-field">
                        <label>{text.themeEffect}</label>
                        <p className="settings-field-hint">
                            {text.themeEffectHint}
                        </p>
                        <select
                            value={config.themeEffect}
                            onChange={(e) => dispatch(setThemeEffect(e.target.value as 'light' | 'dark'))}
                        >
                            <option value="light">{text.light}</option>
                            <option value="dark">{text.dark}</option>
                        </select>
                    </div>
                </section>
            </div>
        );
    }

    if (activePrimaryTab === 'notebook') {
        return <NotebookSettingsSection {...notebookSettingsProps} language={config.language} />;
    }

    if (activeAiTab === 'models') {
        return (
            <div className="settings-tab-panel" data-settings-tab="models">
                <section className="settings-section">
                    <div className="settings-info-card">
                        <strong>{text.modelDefaultsTitle}</strong>
                        <p>{text.modelDefaultsHint}</p>
                    </div>
                    <h3>{text.modelConfiguration}</h3>

                    <div className="settings-field">
                        <label>{text.mainWindowConcurrentModels}</label>
                        <p className="settings-field-hint">
                            {text.concurrentModelsHint}
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
                        <label>{text.defaultMainModels}</label>
                        <p className="settings-field-hint">
                            {text.defaultMainModelsHint}
                        </p>
                        <div className="custom-model-list">
                            {Array.from({ length: config.maxConcurrentMainModels }, (_, slotIndex) => {
                                const selectedId = config.defaultMainModelIds[slotIndex] || config.defaultMainModelIds[0];
                                const selectedInOtherSlots = new Set(
                                    config.defaultMainModelIds.filter((modelId, index) => index !== slotIndex)
                                );

                                return (
                                    <div key={`main-model-slot-${slotIndex}`} className="custom-model-row">
                                        <label>{text.slotLabel(slotIndex)}</label>
                                        <select
                                            value={selectedId}
                                            onChange={(e) =>
                                                dispatch(setDefaultMainModelId({
                                                    index: slotIndex,
                                                    modelId: e.target.value,
                                                }))
                                            }
                                        >
                                            <optgroup label={text.builtIn}>
                                                {provisionedModelOptions.builtIn.map((m) => (
                                                    <option
                                                        key={m.id}
                                                        value={m.id}
                                                        disabled={selectedInOtherSlots.has(m.id)}
                                                    >
                                                        {m.displayName}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            {provisionedModelOptions.custom.length > 0 && (
                                                <optgroup label={text.custom}>
                                                    {provisionedModelOptions.custom.map((m) => (
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
                        <label>{text.subThreadModel}</label>
                        <p className="settings-field-hint">
                            {text.subThreadModelHint}
                        </p>
                        <select
                            value={config.subModelId}
                            onChange={(e) => dispatch(setSubModel(e.target.value))}
                        >
                            <optgroup label={text.builtIn}>
                                {provisionedModelOptions.builtIn.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.displayName}
                                    </option>
                                ))}
                            </optgroup>
                            {provisionedModelOptions.custom.length > 0 && (
                                <optgroup label={text.custom}>
                                    {provisionedModelOptions.custom.map((m) => (
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
                            <label className="settings-search-label" htmlFor="provider-search">{text.providerSearch}</label>
                            {normalizedProviderQuery && (
                                <span className="settings-search-count">
                                    {text.providerMatchCount(providerMatchCount)}
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
                                placeholder={text.providerSearchPlaceholder}
                            />
                            {normalizedProviderQuery && (
                                <button
                                    type="button"
                                    className="settings-search-clear"
                                    onClick={() => onProviderQueryChange?.('')}
                                >
                                    {text.clearSearch}
                                </button>
                            )}
                        </div>
                    </div>
                    <h3>{text.builtInProviderApiKeys}</h3>
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
                                        placeholder={text.enterProviderApiKey(provider.name)}
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
                        <h3>{text.customProviders}</h3>
                        <button
                            className="inline-add-btn provider-action-btn"
                            onClick={() => dispatch(addCustomProvider(undefined))}
                        >
                            <Plus size={14} />
                            <span>{text.addProvider}</span>
                        </button>
                    </div>
                    {filteredCustomProviders.length === 0 && (
                        <p className="settings-hint">
                            {normalizedProviderQuery
                                ? text.noCustomProvidersMatch
                                : text.customProvidersHint}
                        </p>
                    )}
                    {filteredCustomProviders.map((provider) => {
                        const matchesSearch = normalizedProviderQuery.length > 0;
                        const isCollapsed = matchesSearch ? false : collapsedProviderIds?.has(provider.id) ?? false;
                        const modelCount = provider.models.length;
                        const summary = text.modelSummary(modelCount, !!provider.baseUrl);

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
                                            <strong>{provider.name || text.customProviderFallbackName}</strong>
                                            <span className="custom-provider-meta">{summary}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-danger-btn provider-action-btn"
                                        onClick={() => dispatch(removeCustomProvider({ providerId: provider.id }))}
                                        title={text.removeProvider}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {!isCollapsed && (
                                    <>
                                        <div className="settings-field">
                                            <label>{text.providerName}</label>
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
                                                placeholder={text.providerNamePlaceholder}
                                            />
                                        </div>

                                        <div className="settings-field">
                                            <label>{text.baseUrl}</label>
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
                                                placeholder={text.baseUrlPlaceholder}
                                            />
                                        </div>

                                        <div className="settings-field">
                                            <label>{text.apiKey}</label>
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
                                                    placeholder={text.enterApiKey}
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
                                            <label>{text.modelsLabel}</label>
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
                                                        title={isModelFilled(modelName) ? text.dragToReorder : text.enterModelNameFirst}
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
                                                            placeholder={text.modelNamePlaceholder}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="inline-danger-btn provider-action-btn"
                                                            onClick={() =>
                                                                dispatch(removeCustomProviderModel({ providerId: provider.id, index }))
                                                            }
                                                            title={text.removeModel}
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
                                                <span>{text.addModel}</span>
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
                        <strong>{text.lowFrequencyControlsTitle}</strong>
                        <p>{text.lowFrequencyControlsHint}</p>
                    </div>
                    <h3>{text.advanced}</h3>
                    <p className="settings-hint settings-advanced-hint">
                        {text.advancedHint}
                    </p>
                    <div className="settings-field">
                        <label>{text.subSessionContextMode}</label>
                        <div className="settings-option-help">
                            <div><strong>{text.newMode}</strong> {text.newModeHint}</div>
                            <div><strong>{text.keepMode}</strong> {text.keepModeHint}</div>
                        </div>
                        <select
                            value={config.subSessionContextMode}
                            onChange={(e) => dispatch(setSubSessionContextMode(e.target.value as 'new' | 'keep'))}
                        >
                            <option value="new">{text.newMode}</option>
                            <option value="keep">{text.keepMode}</option>
                        </select>
                    </div>
                </section>
            </div>
        );
    }

    return <AiDataSettingsSection {...aiDataSettingsProps} language={config.language} />;
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
    const text = getAppText(config.language);
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
                    <h2>{`⚙️ ${text.settingsTitle}`}</h2>
                    <button className="settings-close" onClick={() => dispatch(toggleSettings())}>
                        <X size={18} />
                    </button>
                </div>
                <div className="settings-layout">
                    <div className="settings-primary-tabs" role="tablist" aria-label={text.settingsSectionsLabel}>
                        {SETTINGS_PRIMARY_TABS.map((tab) => {
                            const isActive = tab === activePrimaryTab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`settings-primary-tab ${isActive ? 'is-active' : ''}`}
                                    onClick={() => setActivePrimaryTab(tab)}
                                >
                                    {text[tab]}
                                </button>
                            );
                        })}
                    </div>
                    <div className="settings-content-column">
                        {activePrimaryTab === 'ai' && (
                            <div className="settings-tabs" role="tablist" aria-label={text.aiSettingsCategoriesLabel}>
                                {SETTINGS_AI_TABS.map((tab) => {
                                    const isActive = tab === activeAiTab;
                                    return (
                                        <button
                                            key={tab}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            className={`settings-tab ${isActive ? 'is-active' : ''}`}
                                            onClick={() => setActiveAiTab(tab)}
                                        >
                                            {text[tab]}
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
