import React from 'react';
import { Settings } from 'lucide-react';
import { AppLanguage, getAppText } from '../../i18n/text';

const SidebarTitleBar: React.FC<{
    onOpenSettings: () => void;
    language?: AppLanguage;
}> = ({ onOpenSettings, language = 'en' }) => {
    const text = getAppText(language);

    return (
        <div className="sidebar-title-bar">
            <h1>{text.appName}</h1>
        <div className="sidebar-title-actions">
            <button
                type="button"
                className="sidebar-title-settings-btn"
                aria-label={text.openGlobalSettings}
                title={text.openGlobalSettings}
                onClick={onOpenSettings}
            >
                <Settings size={16} />
            </button>
        </div>
        </div>
    );
};

export default SidebarTitleBar;
