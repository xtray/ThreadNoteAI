import React from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { AppLanguage, getAppText } from '../../i18n/text';

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
    language?: AppLanguage;
};

type SelectionFloatingActionBarProps = {
    actions: SelectionFloatingAction[];
};

export const createSelectionFloatingActions = ({
    onCreateSubSession,
    onCopySelection,
    copiedSelection = false,
    includeCreateSubSession = true,
    language = 'en',
}: CreateSelectionFloatingActionsParams): SelectionFloatingAction[] => {
    const text = getAppText(language);
    const actions: SelectionFloatingAction[] = [
        {
            id: 'copy-selection',
            title: copiedSelection ? text.copied : text.copySelectedText,
            ariaLabel: copiedSelection ? text.copied : text.copySelectedText,
            label: copiedSelection ? text.copied : undefined,
            isActive: copiedSelection,
            icon: copiedSelection ? <Check size={16} /> : <Copy size={16} />,
            onClick: onCopySelection,
        },
    ];

    if (includeCreateSubSession && onCreateSubSession) {
        actions.push({
            id: 'create-sub-session',
            title: text.createSubSessionDialog,
            ariaLabel: text.createSubSessionDialog,
            icon: <MessageCircle size={16} />,
            onClick: onCreateSubSession,
        });
    }

    return actions;
};

export const createCopyOnlySelectionFloatingActions = ({
    onCopySelection,
    copiedSelection = false,
    language,
}: Pick<CreateSelectionFloatingActionsParams, 'onCopySelection' | 'copiedSelection' | 'language'>): SelectionFloatingAction[] => createSelectionFloatingActions({
    onCopySelection,
    copiedSelection,
    includeCreateSubSession: false,
    language,
});

export const SelectionFloatingActionBar: React.FC<SelectionFloatingActionBarProps & { language?: AppLanguage }> = ({ actions, language = 'en' }) => (
    <div className="selection-floating-actions" aria-label={getAppText(language).selectionActionsLabel}>
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
