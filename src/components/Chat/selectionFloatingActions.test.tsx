import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    SelectionFloatingActionBar,
    createSelectionFloatingActions,
} from './selectionFloatingActions';

describe('selectionFloatingActions', () => {
    it('builds stable create and copy actions with the expected tooltip text', () => {
        const onCreate = () => undefined;
        const onCopy = () => undefined;

        const actions = createSelectionFloatingActions({
            onCreateSubSession: onCreate,
            onCopySelection: onCopy,
        });

        expect(actions).toHaveLength(2);
        expect(actions[0].id).toBe('copy-selection');
        expect(actions[0].title).toBe('Copy selected text');
        expect(actions[0].onClick).toBe(onCopy);
        expect(actions[1].id).toBe('create-sub-session');
        expect(actions[1].title).toBe('Create sub-session dialog');
        expect(actions[1].onClick).toBe(onCreate);
    });

    it('renders an icon-only floating action bar with two buttons', () => {
        const html = renderToStaticMarkup(
            <SelectionFloatingActionBar
                actions={createSelectionFloatingActions({
                    onCreateSubSession: () => undefined,
                    onCopySelection: () => undefined,
                })}
            />
        );

        expect(html).toContain('selection-floating-actions');
        expect(html).toContain('selection-floating-action-btn');
        expect(html).toContain('title="Create sub-session dialog"');
        expect(html).toContain('title="Copy selected text"');
        expect(html).not.toContain('Sub-session');
    });

    it('renders copied feedback for the copy action when copy succeeds', () => {
        const html = renderToStaticMarkup(
            <SelectionFloatingActionBar
                actions={createSelectionFloatingActions({
                    onCreateSubSession: () => undefined,
                    onCopySelection: () => undefined,
                    copiedSelection: true,
                })}
            />
        );

        expect(html).toContain('Copied');
        expect(html).toContain('title="Copied"');
        expect(html).not.toContain('title="Copy selected text"');
    });
});
