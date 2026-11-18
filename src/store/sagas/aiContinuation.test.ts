import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { aiSaga, bindAiSagaStore } from './aiSaga';
import sessions, { createSession, sendMessage } from '../slices/sessionSlice';
import config from '../slices/configSlice';

afterEach(() => vi.unstubAllGlobals());

describe('continuation error persistence', () => {
    it.each([null, 'parent-message'])('preserves partial output in session with parent %s', async (parentId) => {
        const middleware = createSagaMiddleware();
        const settings = {
            ...config(undefined, { type: 'init' }),
            apiKeys: { openai: 'test' },
            defaultMainModelIds: ['gpt-4o'],
        };
        const store = configureStore({
            reducer: { sessions, config: () => settings },
            middleware: getDefault => getDefault({ thunk: false }).concat(middleware),
        });
        bindAiSagaStore(store as any);
        const task = middleware.run(aiSaga);
        try {
            store.dispatch(createSession({
                id: 'test', parentId, anchorText: null, anchorMessageId: null,
                modelId: 'gpt-4o', messages: [], isLoading: false,
            }));
            vi.stubGlobal('fetch', vi.fn()
                .mockResolvedValueOnce(new Response('data: {"choices":[{"delta":{"content":"partial answer"},"finish_reason":"length"}]}\n\n', {
                    headers: { 'content-type': 'text/event-stream' },
                }))
                .mockRejectedValueOnce(new Error('continuation failed')));
            store.dispatch(sendMessage({ sessionId: 'test', content: 'long question', selectedModelIds: ['gpt-4o'] }));
            await vi.waitFor(() => expect(store.getState().sessions.sessions.test.isLoading).toBe(false));
            const session = store.getState().sessions.sessions.test;
            const answer = session.messages.find(message => message.role === 'assistant');
            expect(answer?.content).toBe('partial answer\n\n❌ Request failed: continuation failed');
            if (!parentId) {
                const round = Object.values(session.multiModel!.rounds)[0];
                expect(round.modelReplies['gpt-4o'].content).toBe(answer?.content);
                expect(round.modelReplies['gpt-4o'].status).toBe('error');
            }
        } finally {
            task.cancel();
        }
    });
});
