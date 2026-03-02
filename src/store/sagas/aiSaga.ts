import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import axios from 'axios'
import { store, RootState } from '..'
import { callAIStream } from '../../utils/api'
import {
    addMessage,
    initializeMultiModelRound,
    Message,
    setSessionLoading,
    updateMessage,
    upsertMultiModelRoundReply,
} from '../slices/sessionSlice'

const controllersBySession = new Map<string, Map<string, AbortController>>();
const MAX_MAIN_MODELS = 3;
const MIN_MAIN_MODELS = 1;
const NO_CONTENT_RETURNED = '(No content returned)';
const RESPONSE_STOPPED = '⏹️ Response stopped.';

type SendMessageAction = {
    type: string;
    payload: {
        sessionId: string;
        content: string;
        selectedModelIds?: string[];
    };
};

const uniqueNonEmptyModelIds = (modelIds: string[] | undefined) => {
    if (!modelIds || modelIds.length === 0) return [];
    const deduped = new Set<string>();
    modelIds.forEach((modelId) => {
        if (modelId) {
            deduped.add(modelId);
        }
    });
    return [...deduped];
};

const clampMainModelLimit = (value: number) =>
    Math.min(MAX_MAIN_MODELS, Math.max(MIN_MAIN_MODELS, Math.trunc(value || MIN_MAIN_MODELS)));

export const shouldUseRootMultiModelFlow = (parentId: string | null) => parentId === null;

export const resolveRootSelectedModelIds = (options: {
    selectedModelIdsOverride?: string[];
    lastUsedSelectedModelIds?: string[];
    defaultMainModelIds?: string[];
    maxConcurrentMainModels: number;
    multiReplyEnabled?: boolean;
    primaryModelId?: string | null;
    fallbackModelId: string;
}) => {
    if (options.multiReplyEnabled === false) {
        return [options.primaryModelId || options.fallbackModelId];
    }
    const overrideModelIds = uniqueNonEmptyModelIds(options.selectedModelIdsOverride);
    const lastUsedModelIds = uniqueNonEmptyModelIds(options.lastUsedSelectedModelIds);
    const defaultModelIds = uniqueNonEmptyModelIds(options.defaultMainModelIds);
    const preferredModelIds = overrideModelIds.length > 0
        ? overrideModelIds
        : lastUsedModelIds.length > 0
            ? lastUsedModelIds
            : defaultModelIds;
    const maxConcurrentMainModels = clampMainModelLimit(options.maxConcurrentMainModels);
    return preferredModelIds.slice(0, maxConcurrentMainModels);
};

const isAbortError = (error: any) =>
    axios.isCancel(error)
    || error?.code === 'ERR_CANCELED'
    || error?.name === 'CanceledError'
    || error?.name === 'AbortError';

const extractErrorMessage = (error: any) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.base_resp?.status_msg
    || error?.message
    || 'Unknown error';

const getMessagesForAI = (state: RootState, sessionId: string) => {
    const session = state.sessions.sessions[sessionId];
    if (!session) return [];
    if (
        session.parentId !== null
        && session.contextMode === 'keep'
        && Array.isArray(session.mainContextSnapshotMessages)
    ) {
        return [...session.mainContextSnapshotMessages, ...session.messages];
    }
    return session.messages;
};

const maybeMirrorPrimaryToCanonical = (options: {
    sessionId: string;
    roundId: string;
    modelId: string;
    assistantMessageId: string;
    content: string;
}) => {
    const latestState = store.getState() as RootState;
    const latestSession = latestState.sessions.sessions[options.sessionId];
    const multiModel = latestSession?.multiModel;
    if (!latestSession || !multiModel) return;
    if (multiModel.activeRoundId !== options.roundId) return;
    if (multiModel.primaryModelId !== options.modelId) return;

    const canonicalAssistant = latestSession.messages.find((message) => message.id === options.assistantMessageId);
    if (!canonicalAssistant) return;

    store.dispatch(updateMessage({
        sessionId: options.sessionId,
        messageId: options.assistantMessageId,
        content: options.content,
        modelId: options.modelId,
    }));
};

const streamRootModelReply = async (options: {
    sessionId: string;
    roundId: string;
    modelId: string;
    assistantMessageId: string;
    messagesForAI: Message[];
    config: Pick<RootState['config'], 'apiKeys' | 'customProviders'>;
    controllers: Map<string, AbortController>;
}) => {
    const controller = new AbortController();
    options.controllers.set(options.modelId, controller);
    store.dispatch(upsertMultiModelRoundReply({
        sessionId: options.sessionId,
        roundId: options.roundId,
        modelId: options.modelId,
        status: 'streaming',
        content: '',
    }));

    let latestContent = '';
    try {
        await callAIStream(
            options.modelId,
            options.messagesForAI,
            options.config,
            (content) => {
                latestContent = content;
                store.dispatch(upsertMultiModelRoundReply({
                    sessionId: options.sessionId,
                    roundId: options.roundId,
                    modelId: options.modelId,
                    content,
                    status: 'streaming',
                }));
                maybeMirrorPrimaryToCanonical({
                    sessionId: options.sessionId,
                    roundId: options.roundId,
                    modelId: options.modelId,
                    assistantMessageId: options.assistantMessageId,
                    content,
                });
            },
            controller.signal,
        );

        const finalContent = latestContent.trim() ? latestContent : NO_CONTENT_RETURNED;
        store.dispatch(upsertMultiModelRoundReply({
            sessionId: options.sessionId,
            roundId: options.roundId,
            modelId: options.modelId,
            content: finalContent,
            status: 'done',
        }));
        maybeMirrorPrimaryToCanonical({
            sessionId: options.sessionId,
            roundId: options.roundId,
            modelId: options.modelId,
            assistantMessageId: options.assistantMessageId,
            content: finalContent,
        });
    } catch (error: any) {
        if (isAbortError(error)) {
            const stoppedContent = latestContent.trim() ? latestContent : RESPONSE_STOPPED;
            store.dispatch(upsertMultiModelRoundReply({
                sessionId: options.sessionId,
                roundId: options.roundId,
                modelId: options.modelId,
                content: stoppedContent,
                status: 'done',
            }));
            maybeMirrorPrimaryToCanonical({
                sessionId: options.sessionId,
                roundId: options.roundId,
                modelId: options.modelId,
                assistantMessageId: options.assistantMessageId,
                content: stoppedContent,
            });
            return;
        }

        const failureContent = `❌ Request failed: ${extractErrorMessage(error)}`;
        store.dispatch(upsertMultiModelRoundReply({
            sessionId: options.sessionId,
            roundId: options.roundId,
            modelId: options.modelId,
            content: failureContent,
            status: 'error',
        }));
        maybeMirrorPrimaryToCanonical({
            sessionId: options.sessionId,
            roundId: options.roundId,
            modelId: options.modelId,
            assistantMessageId: options.assistantMessageId,
            content: failureContent,
        });
    } finally {
        options.controllers.delete(options.modelId);
    }
};

const streamSingleModelReply = async (options: {
    sessionId: string;
    modelId: string;
    assistantMessageId: string;
    messagesForAI: Message[];
    config: Pick<RootState['config'], 'apiKeys' | 'customProviders'>;
    controller: AbortController;
}) => {
    let latestContent = '';
    await callAIStream(
        options.modelId,
        options.messagesForAI,
        options.config,
        (content) => {
            latestContent = content;
            store.dispatch(updateMessage({
                sessionId: options.sessionId,
                messageId: options.assistantMessageId,
                content,
                modelId: options.modelId,
            }));
        },
        options.controller.signal,
    );

    if (!latestContent.trim()) {
        store.dispatch(updateMessage({
            sessionId: options.sessionId,
            messageId: options.assistantMessageId,
            content: NO_CONTENT_RETURNED,
            modelId: options.modelId,
        }));
    }
};

function* handleSendMessage(action: SendMessageAction) {
    const { sessionId, content, selectedModelIds } = action.payload;

    const currentState: RootState = yield select();
    const currentSession = currentState.sessions.sessions[sessionId];
    if (!currentSession || currentSession.isLoading) return;

    const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
    };
    yield put(addMessage({ sessionId, message: userMessage }));
    yield put(setSessionLoading({ sessionId, isLoading: true }));

    const state: RootState = yield select();
    const session = state.sessions.sessions[sessionId];
    if (!session) {
        yield put(setSessionLoading({ sessionId, isLoading: false }));
        return;
    }

    const messagesForAI = getMessagesForAI(state, sessionId);
    const isRootMultiModelSession = shouldUseRootMultiModelFlow(session.parentId);
    const resolvedModelIds = isRootMultiModelSession
        ? resolveRootSelectedModelIds({
            selectedModelIdsOverride: selectedModelIds,
            lastUsedSelectedModelIds: session.multiModel?.lastUsedSelectedModelIds || [],
            defaultMainModelIds: state.config.defaultMainModelIds,
            maxConcurrentMainModels: state.config.maxConcurrentMainModels,
            multiReplyEnabled: session.multiReplyEnabled !== false,
            primaryModelId: session.multiModel?.primaryModelId,
            fallbackModelId: session.modelId,
        })
        : [session.modelId];
    const selectedRootModelIds = resolvedModelIds.length > 0
        ? resolvedModelIds
        : [session.modelId];
    const rootPrimaryModelId = selectedRootModelIds[0];
    const assistantMessageId = (Date.now() + 1).toString();
    yield put(addMessage({
        sessionId,
        message: {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            modelId: isRootMultiModelSession ? rootPrimaryModelId : session.modelId,
        },
    }));

    const modelControllers = new Map<string, AbortController>();
    controllersBySession.set(sessionId, modelControllers);

    try {
        if (!isRootMultiModelSession) {
            const controller = new AbortController();
            modelControllers.set(session.modelId, controller);
            try {
                yield call(streamSingleModelReply, {
                    sessionId,
                    modelId: session.modelId,
                    assistantMessageId,
                    messagesForAI,
                    config: {
                        apiKeys: state.config.apiKeys,
                        customProviders: state.config.customProviders,
                    },
                    controller,
                });
            } catch (error: any) {
                if (isAbortError(error)) {
                    const latestState: RootState = yield select();
                    const latestSession = latestState.sessions.sessions[sessionId];
                    const assistantMsg = latestSession?.messages.find((m) => m.id === assistantMessageId);
                    if (!assistantMsg?.content?.trim()) {
                        yield put(updateMessage({
                            sessionId,
                            messageId: assistantMessageId,
                            content: RESPONSE_STOPPED,
                            modelId: session.modelId,
                        }));
                    }
                    return;
                }

                const errMsg = extractErrorMessage(error);
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
                            modelId: session.modelId,
                        },
                    }));
                } else {
                    yield put(updateMessage({
                        sessionId,
                        messageId: assistantMessageId,
                        content: `❌ Request failed: ${errMsg}`,
                        modelId: session.modelId,
                    }));
                }
            } finally {
                modelControllers.delete(session.modelId);
            }
            return;
        }

        const roundId = `round-${Date.now()}`;
        const primaryModelId = rootPrimaryModelId;

        yield put(initializeMultiModelRound({
            sessionId,
            roundId,
            selectedModelIds: selectedRootModelIds,
            primaryModelId,
        }));

        yield all(selectedRootModelIds.map((modelId) =>
            call(streamRootModelReply, {
                sessionId,
                roundId,
                modelId,
                assistantMessageId,
                messagesForAI,
                config: {
                    apiKeys: state.config.apiKeys,
                    customProviders: state.config.customProviders,
                },
                controllers: modelControllers,
            })
        ));
    } finally {
        controllersBySession.delete(sessionId);
        yield put(setSessionLoading({ sessionId, isLoading: false }));
    }
}

function* handleStopGenerating(action: { type: string; payload: { sessionId: string } }) {
    const controllers = controllersBySession.get(action.payload.sessionId);
    if (!controllers) return;

    controllers.forEach((controller) => {
        controller.abort();
    });
    controllersBySession.delete(action.payload.sessionId);
}

export function* aiSaga() {
    yield takeEvery('sessions/sendMessage', handleSendMessage);
    yield takeEvery('sessions/stopGenerating', handleStopGenerating);
}
