import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
    SelectionFloatingActionBar,
    createCopyOnlySelectionFloatingActions,
    createSelectionFloatingActions,
} from './selectionFloatingActions';

const readIndexCss = () => readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

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
        expect(html).toContain('selection-floating-action-tooltip');
        expect(html).toContain('Create sub-session dialog');
        expect(html).toContain('Copy selected text');
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
        expect(html).toContain('selection-floating-action-tooltip');
        expect(html).not.toContain('Copy selected text</span>');
    });

    it('builds a copy-only action set for sub-session text selection', () => {
        const onCopy = () => undefined;

        const actions = createCopyOnlySelectionFloatingActions({
            onCopySelection: onCopy,
        });

        expect(actions).toHaveLength(1);
        expect(actions[0].id).toBe('copy-selection');
        expect(actions[0].onClick).toBe(onCopy);
    });

    it('renders a copy-only floating action bar without the sub-session button', () => {
        const html = renderToStaticMarkup(
            <SelectionFloatingActionBar
                actions={createCopyOnlySelectionFloatingActions({
                    onCopySelection: () => undefined,
                })}
            />
        );

        expect(html).toContain('selection-floating-actions');
        expect(html).toContain('selection-floating-action-tooltip');
        expect(html).toContain('Copy selected text');
        expect(html).not.toContain('Create sub-session dialog');
    });

    it('does not use the old diamond connector styling for the tooltip surface', () => {
        const css = readIndexCss();

        expect(css).not.toContain('.selection-floating-action-tooltip::after');
    });
});
