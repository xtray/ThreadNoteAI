import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sessionReducer, { ChatSession, Message, SessionState } from '../../store/slices/sessionSlice';
import configReducer from '../../store/slices/configSlice';
import notesReducer from '../../store/slices/notesSlice';
import FloatingOverlay from './FloatingOverlay';

const buildSessionState = (messages: Message[]): SessionState => ({
    activeSessionId: 'sub-1',
    sessions: {
        'sub-1': {
            id: 'sub-1',
            parentId: 'main',
            anchorText: 'selected excerpt',
            anchorMessageId: 'a1',
            messages,
            modelId: 'deepseek-chat',
            isLoading: false,
            contextMode: 'new',
        } as ChatSession,
    },
});

const renderOverlay = (messages: Message[]) => {
    const store = configureStore({
        reducer: {
            sessions: sessionReducer,
            config: configReducer,
            notes: notesReducer,
        },
        preloadedState: {
            sessions: buildSessionState(messages),
        },
    });

    return renderToStaticMarkup(
        <Provider store={store}>
            <FloatingOverlay sessionId="sub-1" onClose={() => {}} />
        </Provider>
    );
};

describe('FloatingOverlay code block copy button', () => {
    it('marks assistant replies as selectable text targets in sub-sessions', () => {
        const html = renderOverlay([
            { id: 'u1', role: 'user', content: 'show code', timestamp: 1 },
            { id: 'a1', role: 'assistant', content: 'answer', timestamp: 2, modelId: 'deepseek-chat' },
        ]);

        expect(html).toContain('overlay-message assistant overlay-message-selectable');
    });

    it('renders both left-side resize handles for non-fullscreen sub-sessions', () => {
        const html = renderOverlay([
            { id: 'u1', role: 'user', content: 'show code', timestamp: 1 },
            { id: 'a1', role: 'assistant', content: 'answer', timestamp: 2, modelId: 'deepseek-chat' },
        ]);

        expect(html).toContain('overlay-resize-handle overlay-resize-handle-top-left');
        expect(html).toContain('overlay-resize-handle overlay-resize-handle-bottom-left');
    });

    it('renders copy button for assistant fenced code blocks in sub-sessions', () => {
        const html = renderOverlay([
            { id: 'u1', role: 'user', content: 'show code', timestamp: 1 },
            { id: 'a1', role: 'assistant', content: '```ts\nconst x = 1;\n```', timestamp: 2, modelId: 'deepseek-chat' },
        ]);

        expect(html).toContain('code-block-copy-btn');
    });

    it('does not render copy button for user fenced code blocks in sub-sessions', () => {
        const html = renderOverlay([
            { id: 'u1', role: 'user', content: '```ts\nconst x = 1;\n```', timestamp: 1 },
        ]);

        expect(html).not.toContain('code-block-copy-btn');
    });
});
