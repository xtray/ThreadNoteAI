import React from 'react';
import { AppLanguage, getAppText } from '../../i18n/text';

export type AiDataSettingsSectionProps = {
    onExportAiConfig?: () => void;
    onImportAiConfig?: () => void;
    onExportAiChats?: () => void;
    onOverwriteAiChats?: () => void;
    onMergeAiChats?: () => void;
    language?: AppLanguage;
};

const AiDataSettingsSection: React.FC<AiDataSettingsSectionProps> = ({
    onExportAiConfig,
    onImportAiConfig,
    onExportAiChats,
    onOverwriteAiChats,
    onMergeAiChats,
    language = 'en',
}) => {
    const text = getAppText(language);

    return (
        <div className="settings-tab-panel" data-settings-tab="data">
        <section className="settings-section">
            <div className="settings-info-card">
                <strong>{text.modelProviderConfigTitle}</strong>
                <p>{text.modelProviderConfigHint}</p>
            </div>
            <div className="settings-action-group">
                <button className="note-settings-action" onClick={onExportAiConfig}>
                    <span>{text.exportModelProviderConfig}</span>
                </button>
                <button className="note-settings-action" onClick={onImportAiConfig}>
                    <span>{text.importModelProviderConfig}</span>
                </button>
            </div>
        </section>

        <section className="settings-section">
            <div className="settings-info-card">
                <strong>{text.aiChatsTitle}</strong>
                <p>{text.aiChatsHint}</p>
            </div>
            <div className="settings-action-group">
                <button className="note-settings-action" onClick={onExportAiChats}>
                    <span>{text.exportAllAiChats}</span>
                </button>
                <button className="note-settings-action" onClick={onOverwriteAiChats}>
                    <span>{text.overwriteCurrentChats}</span>
                </button>
                <button className="note-settings-action" onClick={onMergeAiChats}>
                    <span>{text.mergeIntoCurrentChats}</span>
                </button>
            </div>
        </section>
        </div>
    );
};

export default AiDataSettingsSection;
