import React from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';

export type SelectionFloatingAction = {
    id: 'create-sub-session' | 'copy-selection';
    title: string;
    ariaLabel: string;
    label?: string;
    isActive?: boolean;
    icon: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type CreateSelectionFloatingActionsParams = {
    onCreateSubSession: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onCopySelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
    copiedSelection?: boolean;
};

type SelectionFloatingActionBarProps = {
    actions: SelectionFloatingAction[];
};

export const createSelectionFloatingActions = ({
    onCreateSubSession,
    onCopySelection,
    copiedSelection = false,
}: CreateSelectionFloatingActionsParams): SelectionFloatingAction[] => ([
    {
        id: 'copy-selection',
        title: copiedSelection ? 'Copied' : 'Copy selected text',
        ariaLabel: copiedSelection ? 'Copied' : 'Copy selected text',
        label: copiedSelection ? 'Copied' : undefined,
        isActive: copiedSelection,
        icon: copiedSelection ? <Check size={16} /> : <Copy size={16} />,
        onClick: onCopySelection,
    },
    {
        id: 'create-sub-session',
        title: 'Create sub-session dialog',
        ariaLabel: 'Create sub-session dialog',
        icon: <MessageCircle size={16} />,
        onClick: onCreateSubSession,
    },
]);

export const SelectionFloatingActionBar: React.FC<SelectionFloatingActionBarProps> = ({ actions }) => (
    <div className="selection-floating-actions" aria-label="Selection actions">
        {actions.map((action) => (
            <button
                key={action.id}
                type="button"
                className={`selection-floating-action-btn${action.isActive ? ' is-active' : ''}`}
                title={action.title}
                aria-label={action.ariaLabel}
                onClick={action.onClick}
            >
                {action.icon}
                {action.label && (
                    <span className="selection-floating-action-label">{action.label}</span>
                )}
            </button>
        ))}
    </div>
);
