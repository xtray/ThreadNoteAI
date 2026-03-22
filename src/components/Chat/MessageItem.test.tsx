import React from 'react';
import fs from 'node:fs';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sessionReducer, { ChatSession, Message, SessionState } from '../../store/slices/sessionSlice';
import configReducer from '../../store/slices/configSlice';
import notesReducer from '../../store/slices/notesSlice';
import MessageItem from './MessageItem';

const buildSessionState = (messages: Message[]): SessionState => ({
    activeSessionId: 'main',
    sessions: {
        main: {
            id: 'main',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            messages,
            modelId: 'deepseek-chat',
            isLoading: false,
        } as ChatSession,
    },
});

const renderMessageItem = (message: Message, messages: Message[]) => {
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
            <MessageItem
                message={message}
                sessionId="main"
                messageIndex={messages.findIndex((item) => item.id === message.id)}
            />
        </Provider>
    );
};

describe('MessageItem regenerate action', () => {
    it('renders regenerate for assistant turns', () => {
        const messages: Message[] = [
            { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
            { id: 'a1', role: 'assistant', content: 'Answer', timestamp: 2, modelId: 'deepseek-chat' },
        ];

        const html = renderMessageItem(messages[1], messages);

        expect(html).toContain('Copy');
        expect(html).toContain('Regenerate');
    });

    it('does not render regenerate for user turns', () => {
        const messages: Message[] = [
            { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
        ];

        const html = renderMessageItem(messages[0], messages);

        expect(html).not.toContain('Regenerate');
    });

    it('requires confirmation before deleting a main-thread turn', () => {
        const source = fs.readFileSync(new URL('./MessageItem.tsx', import.meta.url), 'utf8');

        expect(source).toContain('const [deleteConfirm, setDeleteConfirm]');
        expect(source).toContain('setDeleteConfirm({ sessionId, messageId: message.id })');
        expect(source).toContain('dispatch(removeTurn(deleteConfirm))');
        expect(source).toContain('<h3>Delete turn?</h3>');
    });
});
