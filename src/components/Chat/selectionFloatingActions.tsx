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
    onCreateSubSession?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onCopySelection: (event: React.MouseEvent<HTMLButtonElement>) => void;
    copiedSelection?: boolean;
    includeCreateSubSession?: boolean;
};

type SelectionFloatingActionBarProps = {
    actions: SelectionFloatingAction[];
};

export const createSelectionFloatingActions = ({
    onCreateSubSession,
    onCopySelection,
    copiedSelection = false,
    includeCreateSubSession = true,
}: CreateSelectionFloatingActionsParams): SelectionFloatingAction[] => {
    const actions: SelectionFloatingAction[] = [
        {
            id: 'copy-selection',
            title: copiedSelection ? 'Copied' : 'Copy selected text',
            ariaLabel: copiedSelection ? 'Copied' : 'Copy selected text',
            label: copiedSelection ? 'Copied' : undefined,
            isActive: copiedSelection,
            icon: copiedSelection ? <Check size={16} /> : <Copy size={16} />,
            onClick: onCopySelection,
        },
    ];

    if (includeCreateSubSession && onCreateSubSession) {
        actions.push({
            id: 'create-sub-session',
            title: 'Create sub-session dialog',
            ariaLabel: 'Create sub-session dialog',
            icon: <MessageCircle size={16} />,
            onClick: onCreateSubSession,
        });
    }

    return actions;
};

export const createCopyOnlySelectionFloatingActions = ({
    onCopySelection,
    copiedSelection = false,
}: Pick<CreateSelectionFloatingActionsParams, 'onCopySelection' | 'copiedSelection'>): SelectionFloatingAction[] => createSelectionFloatingActions({
    onCopySelection,
    copiedSelection,
    includeCreateSubSession: false,
});

export const SelectionFloatingActionBar: React.FC<SelectionFloatingActionBarProps> = ({ actions }) => (
    <div className="selection-floating-actions" aria-label="Selection actions">
        {actions.map((action) => (
            <button
                key={action.id}
                type="button"
                className={`selection-floating-action-btn${action.isActive ? ' is-active' : ''}`}
                aria-label={action.ariaLabel}
                onClick={action.onClick}
            >
                <span className="selection-floating-action-tooltip" aria-hidden="true">
                    {action.title}
                </span>
                {action.icon}
                {action.label && (
                    <span className="selection-floating-action-label">{action.label}</span>
                )}
            </button>
        ))}
    </div>
);
