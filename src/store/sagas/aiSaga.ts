import { takeEvery, put, call, select } from 'redux-saga/effects'
import { addMessage, Message, setSessionLoading, updateMessage } from '../slices/sessionSlice'
import { callAIStream } from '../../utils/api'
import { RootState } from '..'
import axios from 'axios'
import { store } from '..'

const controllers = new Map<string, AbortController>();

function* handleSendMessage(action: { type: string; payload: { sessionId: string; content: string } }) {
    const { sessionId, content } = action.payload;

    const currentState: RootState = yield select();
    const currentSession = currentState.sessions.sessions[sessionId];
    if (!currentSession || currentSession.isLoading) return;

    // 1. Add user message
    const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
    };

    yield put(addMessage({ sessionId, message: userMessage }));

    // 2. Set loading
    yield put(setSessionLoading({ sessionId, isLoading: true }));

    // 3. Resolve which model & apiKey to use (after user message is in state)
    const state: RootState = yield select();
    const session = state.sessions.sessions[sessionId];
    if (!session) {
        yield put(setSessionLoading({ sessionId, isLoading: false }));
        return;
    }

    const modelId = session.modelId;

    const messagesForAI = (
        session.parentId !== null
        && session.contextMode === 'keep'
        && Array.isArray(session.mainContextSnapshotMessages)
    )
        ? [...session.mainContextSnapshotMessages, ...session.messages]
        : session.messages;

    // 4. Call AI
    const controller = new AbortController();
    controllers.set(sessionId, controller);
    const assistantMessageId = (Date.now() + 1).toString();

    yield put(addMessage({
        sessionId,
        message: {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
        },
    }));

    try {
        let latestContent = '';
        yield call(
            callAIStream,
            modelId,
            messagesForAI,
            {
                apiKeys: state.config.apiKeys,
                customProviders: state.config.customProviders,
            },
            (content: string) => {
                latestContent = content;
                store.dispatch(updateMessage({
                    sessionId,
                    messageId: assistantMessageId,
                    content,
                }));
            },
            controller.signal,
        );
        if (!latestContent.trim()) {
            yield put(updateMessage({
                sessionId,
                messageId: assistantMessageId,
                content: '(No content returned)',
            }));
        }
    } catch (error: any) {
        const cancelled = axios.isCancel(error)
            || error?.code === 'ERR_CANCELED'
            || error?.name === 'CanceledError'
            || error?.name === 'AbortError';
        if (cancelled) {
            const latestState: RootState = yield select();
            const latestSession = latestState.sessions.sessions[sessionId];
            const assistantMsg = latestSession?.messages.find((m) => m.id === assistantMessageId);
            if (!assistantMsg?.content?.trim()) {
                yield put(updateMessage({
                    sessionId,
                    messageId: assistantMessageId,
                    content: '⏹️ Response stopped.',
                }));
            }
            return;
        }

        const errMsg = error?.response?.data?.error?.message
            || error?.response?.data?.base_resp?.status_msg
            || error?.message
            || 'Unknown error';

        const latestState: RootState = yield select();
        const latestSession = latestState.sessions.sessions[sessionId];
        const assistantMsg = latestSession?.messages.find((m) => m.id === assistantMessageId);
        if (!assistantMsg) {
            yield put(addMessage({
                sessionId,
                message: {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `❌ Request failed: ${errMsg}`,
                    timestamp: Date.now(),
                },
            }));
        } else {
            yield put(updateMessage({
                sessionId,
                messageId: assistantMessageId,
                content: `❌ Request failed: ${errMsg}`,
            }));
        }
    } finally {
        controllers.delete(sessionId);
        yield put(setSessionLoading({ sessionId, isLoading: false }));
    }
}

function* handleStopGenerating(action: { type: string; payload: { sessionId: string } }) {
    const controller = controllers.get(action.payload.sessionId);
    if (controller) {
        controller.abort();
        controllers.delete(action.payload.sessionId);
    }
}

export function* aiSaga() {
    yield takeEvery('sessions/sendMessage', handleSendMessage);
    yield takeEvery('sessions/stopGenerating', handleStopGenerating);
}
