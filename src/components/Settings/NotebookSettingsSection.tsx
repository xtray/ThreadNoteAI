import React from 'react';
import { Download, Upload } from 'lucide-react';
import { AppLanguage, getAppText } from '../../i18n/text';

export type NotebookSettingsSectionProps = {
    onExportAllNotes?: () => void;
    onImportNotesClick?: () => void;
    importInputRef?: React.Ref<HTMLInputElement>;
    onImportNotesChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    hint?: string;
    language?: AppLanguage;
};

const NotebookSettingsSection: React.FC<NotebookSettingsSectionProps> = ({
    onExportAllNotes,
    onImportNotesClick,
    importInputRef,
    onImportNotesChange,
    hint = '',
    language = 'en',
}) => {
    const text = getAppText(language);

    return (
        <div className="settings-tab-panel" data-settings-primary-tab="notebook">
        <section className="settings-section">
            <h3>{text.notebookExport}</h3>
            <button className="note-settings-action" onClick={onExportAllNotes}>
                <Download size={16} />
                <span>{text.exportAllNotesToDirectory}</span>
            </button>
        </section>

        <section className="settings-section">
            <h3>{text.notebookImport}</h3>
            <button className="note-settings-action" onClick={onImportNotesClick}>
                <Upload size={16} />
                <span>{text.importNotesFromFile}</span>
            </button>
            <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={onImportNotesChange}
            />
        </section>

        {hint && (
            <div className="note-settings-hint">{hint}</div>
        )}
        </div>
    );
};

export default NotebookSettingsSection;
