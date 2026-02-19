import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
    addCustomProvider,
    addCustomProviderModel,
    removeCustomProvider,
    removeCustomProviderModel,
    setApiKey,
    setMainModel,
    setSubModel,
    toggleSettings,
    updateCustomProvider,
    updateCustomProviderModel,
} from '../../store/slices/configSlice';
import { SUPPORTED_PROVIDERS, AVAILABLE_MODELS } from '../../utils/models';
import { getCustomModelOptions } from '../../utils/customModels';
import { X, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

const SettingsPanel: React.FC = () => {
    const dispatch = useDispatch();
    const config = useSelector((state: RootState) => state.config);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
    const customModels = getCustomModelOptions(config.customProviders);

    if (!config.settingsOpen) return null;

    const toggleKeyVisibility = (providerId: string) => {
        setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
    };

    return (
        <div className="settings-backdrop" onClick={() => dispatch(toggleSettings())}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="settings-close" onClick={() => dispatch(toggleSettings())}>
                        <X size={18} />
                    </button>
                </div>

                {/* ─── API Keys ─── */}
                <section className="settings-section">
                    <h3>API Keys (Built-in Providers)</h3>
                    {SUPPORTED_PROVIDERS.map((provider) => (
                        <div className="settings-field" key={provider.id}>
                            <label>{provider.name}</label>
                            <div className="key-input-row">
                                <input
                                    type={visibleKeys[provider.id] ? 'text' : 'password'}
                                    value={config.apiKeys[provider.id] || ''}
                                    onChange={(e) =>
                                        dispatch(setApiKey({ providerId: provider.id, apiKey: e.target.value }))
                                    }
                                    placeholder={`Enter ${provider.name} API Key`}
                                />
                                <button
                                    className="toggle-key-btn"
                                    onClick={() => toggleKeyVisibility(provider.id)}
                                >
                                    {visibleKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="settings-section">
                    <div className="settings-inline-header">
                        <h3>Custom Providers</h3>
                        <button
                            className="inline-add-btn"
                            onClick={() => dispatch(addCustomProvider(undefined))}
                        >
                            <Plus size={14} />
                            <span>Add Provider</span>
                        </button>
                    </div>
                    {config.customProviders.length === 0 && (
                        <p className="settings-hint">
                            Add custom OpenAI-compatible providers (for example, NVIDIA) with Base URL, API key and model names.
                        </p>
                    )}
                    {config.customProviders.map((provider) => (
                        <div className="custom-provider-card" key={provider.id}>
                            <div className="custom-provider-head">
                                <strong>{provider.name || 'Custom Provider'}</strong>
                                <button
                                    className="inline-danger-btn"
                                    onClick={() => dispatch(removeCustomProvider({ providerId: provider.id }))}
                                    title="Remove provider"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="settings-field">
                                <label>Provider Name</label>
                                <input
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
                                        className="toggle-key-btn"
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
                                        <div key={`${provider.id}-${index}`} className="custom-model-row">
                                            <input
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
                                                className="inline-danger-btn"
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
                                    className="inline-add-btn compact"
                                    onClick={() => dispatch(addCustomProviderModel({ providerId: provider.id }))}
                                >
                                    <Plus size={14} />
                                    <span>Add Model</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                {/* ─── Model Selection ─── */}
                <section className="settings-section">
                    <h3>Model Configuration</h3>

                    <div className="settings-field">
                        <label>Main Thread Model</label>
                        <select
                            value={config.mainModelId}
                            onChange={(e) => dispatch(setMainModel(e.target.value))}
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

                    <div className="settings-field">
                        <label>Sub-thread Model</label>
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
        </div>
    );
};

export default SettingsPanel;
