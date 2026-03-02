import React from 'react';

export type TurnToolbarAction = {
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    title?: string;
    onClick: () => void | Promise<void>;
};

interface TurnToolbarProps {
    actions: TurnToolbarAction[];
    className?: string;
}

const TurnToolbar: React.FC<TurnToolbarProps> = ({ actions, className }) => {
    if (!actions.length) return null;

    return (
        <div className={`turn-toolbar${className ? ` ${className}` : ''}`}>
            {actions.map((action) => (
                <button
                    key={action.id}
                    type="button"
                    className="turn-toolbar-btn"
                    title={action.title || action.label}
                    disabled={action.disabled}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        void action.onClick();
                    }}
                >
                    {action.icon && <span className="turn-toolbar-icon">{action.icon}</span>}
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
};

export default TurnToolbar;
