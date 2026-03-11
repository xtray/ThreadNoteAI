import React from 'react';

export type AiDataSettingsSectionProps = {
    onExportAiConfig?: () => void;
    onImportAiConfig?: () => void;
    onExportAiChats?: () => void;
    onOverwriteAiChats?: () => void;
    onMergeAiChats?: () => void;
};

const AiDataSettingsSection: React.FC<AiDataSettingsSectionProps> = ({
    onExportAiConfig,
    onImportAiConfig,
    onExportAiChats,
    onOverwriteAiChats,
    onMergeAiChats,
}) => (
    <div className="settings-tab-panel" data-settings-tab="data">
        <section className="settings-section">
            <div className="settings-info-card">
                <strong>Models &amp; Providers Configuration</strong>
                <p>Back up and restore all Models and Providers settings, including model slots, provider API keys, and custom provider model lists, as one JSON file.</p>
            </div>
            <div className="settings-action-group">
                <button className="note-settings-action" onClick={onExportAiConfig}>
                    <span>Export Models &amp; Providers Configuration</span>
                </button>
                <button className="note-settings-action" onClick={onImportAiConfig}>
                    <span>Import Models &amp; Providers Configuration</span>
                </button>
            </div>
        </section>

        <section className="settings-section">
            <div className="settings-info-card">
                <strong>AI Chats</strong>
                <p>Export all chat history or import a saved chat archive with overwrite or merge behavior.</p>
            </div>
            <div className="settings-action-group">
                <button className="note-settings-action" onClick={onExportAiChats}>
                    <span>Export All AI Chats</span>
                </button>
                <button className="note-settings-action" onClick={onOverwriteAiChats}>
                    <span>Overwrite current chats</span>
                </button>
                <button className="note-settings-action" onClick={onMergeAiChats}>
                    <span>Merge into current chats</span>
                </button>
            </div>
        </section>
    </div>
);

export default AiDataSettingsSection;
