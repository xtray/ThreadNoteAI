import { takeEvery, put, call, select } from 'redux-saga/effects'
import { addMessage, Message, setSessionLoading } from '../slices/sessionSlice'
import { callAI } from '../../utils/api'
import { RootState } from '..'
import { getModelById } from '../../utils/models'
import axios from 'axios'

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

    // 3. Resolve which model & apiKey to use
    const state: RootState = yield select();
    const session = state.sessions.sessions[sessionId];
    if (!session) return;

    const modelId = session.modelId;
    const model = getModelById(modelId);
    if (!model) {
        yield put(addMessage({
            sessionId,
            message: {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Unknown model: ${modelId}`,
                timestamp: Date.now(),
            },
        }));
        yield put(setSessionLoading({ sessionId, isLoading: false }));
        return;
    }

    const apiKey = state.config.apiKeys[model.providerId];
    if (!apiKey) {
        yield put(addMessage({
            sessionId,
            message: {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ Please configure the **${model.providerId}** API key in Settings first.`,
                timestamp: Date.now(),
            },
        }));
        yield put(setSessionLoading({ sessionId, isLoading: false }));
        return;
    }

    // 4. Call AI
    const controller = new AbortController();
    controllers.set(sessionId, controller);
    try {
        const aiResponse: string = yield call(
            callAI,
            modelId,
            [...session.messages, userMessage],
            apiKey,
            controller.signal,
        );

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now(),
        };

        yield put(addMessage({ sessionId, message: assistantMessage }));
    } catch (error: any) {
        const cancelled = axios.isCancel(error)
            || error?.code === 'ERR_CANCELED'
            || error?.name === 'CanceledError';
        if (cancelled) {
            yield put(addMessage({
                sessionId,
                message: {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: '⏹️ Response stopped.',
                    timestamp: Date.now(),
                },
            }));
            return;
        }

        const errMsg = error?.response?.data?.error?.message
            || error?.response?.data?.base_resp?.status_msg
            || error?.message
            || 'Unknown error';

        yield put(addMessage({
            sessionId,
            message: {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: `❌ Request failed: ${errMsg}`,
                timestamp: Date.now(),
            },
        }));
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
