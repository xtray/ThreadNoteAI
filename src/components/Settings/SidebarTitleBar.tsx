import React from 'react';
import { Settings } from 'lucide-react';

const SidebarTitleBar: React.FC<{
    onOpenSettings: () => void;
}> = ({ onOpenSettings }) => (
    <div className="sidebar-title-bar">
        <h1>ThreadNote AI</h1>
        <div className="sidebar-title-actions">
            <button
                type="button"
                className="sidebar-title-settings-btn"
                aria-label="Open global settings"
                title="Open global settings"
                onClick={onOpenSettings}
            >
                <Settings size={16} />
            </button>
        </div>
    </div>
);

export default SidebarTitleBar;
