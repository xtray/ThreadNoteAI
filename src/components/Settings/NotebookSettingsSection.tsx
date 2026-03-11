import React from 'react';
import { Download, Upload } from 'lucide-react';

export type NotebookSettingsSectionProps = {
    onExportAllNotes?: () => void;
    onImportNotesClick?: () => void;
    importInputRef?: React.Ref<HTMLInputElement>;
    onImportNotesChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    hint?: string;
};

const NotebookSettingsSection: React.FC<NotebookSettingsSectionProps> = ({
    onExportAllNotes,
    onImportNotesClick,
    importInputRef,
    onImportNotesChange,
    hint = '',
}) => (
    <div className="settings-tab-panel" data-settings-primary-tab="notebook">
        <section className="settings-section">
            <h3>Export</h3>
            <button className="note-settings-action" onClick={onExportAllNotes}>
                <Download size={16} />
                <span>Export All Notes to Directory</span>
            </button>
        </section>

        <section className="settings-section">
            <h3>Import</h3>
            <button className="note-settings-action" onClick={onImportNotesClick}>
                <Upload size={16} />
                <span>Import Notes from Export File</span>
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

export default NotebookSettingsSection;
