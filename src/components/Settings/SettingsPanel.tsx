import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setApiKey, setMainModel, setSubModel, toggleSettings } from '../../store/slices/configSlice';
import { SUPPORTED_PROVIDERS, AVAILABLE_MODELS, getModelsForProvider } from '../../utils/models';
import { X, Eye, EyeOff } from 'lucide-react';

const SettingsPanel: React.FC = () => {
    const dispatch = useDispatch();
    const config = useSelector((state: RootState) => state.config);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

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
                    <h3>API Keys</h3>
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

                {/* ─── Model Selection ─── */}
                <section className="settings-section">
                    <h3>Model Configuration</h3>

                    <div className="settings-field">
                        <label>Main Thread Model</label>
                        <select
                            value={config.mainModelId}
                            onChange={(e) => dispatch(setMainModel(e.target.value))}
                        >
                            {AVAILABLE_MODELS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="settings-field">
                        <label>Sub-thread Model</label>
                        <select
                            value={config.subModelId}
                            onChange={(e) => dispatch(setSubModel(e.target.value))}
                        >
                            {AVAILABLE_MODELS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsPanel;
