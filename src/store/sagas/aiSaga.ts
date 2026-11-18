import { all, call, put, select, takeEvery } from 'redux-saga/effects'
import axios from 'axios'
import type { RootState } from '..'
import { callAIStream } from '../../utils/api'
import {
    addMessage,
    initializeMultiModelRound,
    Message,
    regenerateMessage,
    sendMessage,
    setSessionLoading,
    stopGenerating,
    updateMessage,
    upsertMultiModelRoundReply,
} from '../slices/sessionSlice'

const controllersBySession = new Map<string, Map<string, AbortController>>();
const MAX_MAIN_MODELS = 3;
const MIN_MAIN_MODELS = 1;
const NO_CONTENT_RETURNED = '(No content returned)';
const RESPONSE_STOPPED = '⏹️ Response stopped.';

type SagaStoreAdapter = {
    dispatch: (action: any) => unknown;
    getState: () => RootState;
};

let sagaStoreAdapter: SagaStoreAdapter | null = null;

export const bindAiSagaStore = (storeAdapter: SagaStoreAdapter) => {
    sagaStoreAdapter = storeAdapter;
};

const getSagaStore = () => {
    if (!sagaStoreAdapter) {
        throw new Error('AI saga store adapter has not been bound');
    }
    return sagaStoreAdapter;
};

type SendMessageAction = {
    type: string;
    payload: {
        sessionId: string;
        content: string;
        selectedModelIds?: string[];
        skipUserMessageAdd?: boolean;
        assistantMessageId?: string;
        contextEndIndexExclusive?: number;
    };
};

type RegenerateMessageAction = {
    type: string;
    payload: {
        sessionId: string;
        messageId: string;
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

const findPreviousUserMessage = (messages: Message[], messageId: string) => {
    const assistantIndex = messages.findIndex((message) => message.id === messageId);
    if (assistantIndex < 0) return null;

    const assistantMessage = messages[assistantIndex];
    if (assistantMessage.role !== 'assistant') return null;

    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
        const candidate = messages[index];
        if (candidate.role === 'user') {
            return candidate;
        }
    }

    return null;
};

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

export const formatStreamFailure = (content: string, message: string) =>
    `${content.trim() ? content + '\n\n' : ''}❌ Request failed: ${message}`;

const extractErrorMessage = (error: any) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.base_resp?.status_msg
    || error?.message
    || 'Unknown error';

const getMessagesForAI = (
    state: RootState,
    sessionId: string,
    options?: {
        endIndexExclusive?: number;
        appendMessages?: Message[];
    }
) => {
    const session = state.sessions.sessions[sessionId];
    if (!session) return [];
    const sessionMessages = typeof options?.endIndexExclusive === 'number'
        ? session.messages.slice(0, options.endIndexExclusive)
        : session.messages;
    const appendMessages = options?.appendMessages || [];
    if (
        session.parentId !== null
        && session.contextMode === 'keep'
        && Array.isArray(session.mainContextSnapshotMessages)
    ) {
        return [...session.mainContextSnapshotMessages, ...sessionMessages, ...appendMessages];
    }
    return [...sessionMessages, ...appendMessages];
};

const maybeMirrorPrimaryToCanonical = (options: {
    sessionId: string;
    roundId: string;
    modelId: string;
    assistantMessageId: string;
    content: string;
}) => {
    const latestState = getSagaStore().getState();
    const latestSession = latestState.sessions.sessions[options.sessionId];
    const multiModel = latestSession?.multiModel;
    if (!latestSession || !multiModel) return;
    if (multiModel.activeRoundId !== options.roundId) return;
    if (multiModel.primaryModelId !== options.modelId) return;

    const canonicalAssistant = latestSession.messages.find((message) => message.id === options.assistantMessageId);
    if (!canonicalAssistant) return;

    getSagaStore().dispatch(updateMessage({
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
    getSagaStore().dispatch(upsertMultiModelRoundReply({
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
                getSagaStore().dispatch(upsertMultiModelRoundReply({
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
        getSagaStore().dispatch(upsertMultiModelRoundReply({
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
            getSagaStore().dispatch(upsertMultiModelRoundReply({
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

        const failureContent = formatStreamFailure(latestContent, extractErrorMessage(error));
        getSagaStore().dispatch(upsertMultiModelRoundReply({
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
            getSagaStore().dispatch(updateMessage({
                sessionId: options.sessionId,
                messageId: options.assistantMessageId,
                content,
                modelId: options.modelId,
            }));
        },
        options.controller.signal,
    );

    if (!latestContent.trim()) {
        getSagaStore().dispatch(updateMessage({
            sessionId: options.sessionId,
            messageId: options.assistantMessageId,
            content: NO_CONTENT_RETURNED,
            modelId: options.modelId,
        }));
    }
};

function* handleSendMessage(action: SendMessageAction) {
    const {
        sessionId,
        content,
        selectedModelIds,
        skipUserMessageAdd,
        assistantMessageId: existingAssistantMessageId,
        contextEndIndexExclusive,
    } = action.payload;

    const currentState: RootState = yield select();
    const currentSession = currentState.sessions.sessions[sessionId];
    if (!currentSession || currentSession.isLoading) return;

    const userMessage: Message | null = skipUserMessageAdd
        ? null
        : {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };
    if (userMessage) {
        yield put(addMessage({ sessionId, message: userMessage }));
    }
    yield put(setSessionLoading({ sessionId, isLoading: true }));
    const messagesForAI = getMessagesForAI(currentState, sessionId, {
        endIndexExclusive: contextEndIndexExclusive,
        appendMessages: userMessage ? [userMessage] : [],
    });
    const session = currentSession;
    const state = currentState;
    const isRootMultiModelSession = shouldUseRootMultiModelFlow(currentSession.parentId);
    const resolvedModelIds = isRootMultiModelSession
        ? resolveRootSelectedModelIds({
            selectedModelIdsOverride: selectedModelIds,
            lastUsedSelectedModelIds: currentSession.multiModel?.lastUsedSelectedModelIds || [],
            defaultMainModelIds: state.config.defaultMainModelIds,
            maxConcurrentMainModels: state.config.maxConcurrentMainModels,
            multiReplyEnabled: currentSession.multiReplyEnabled !== false,
            primaryModelId: currentSession.multiModel?.primaryModelId,
            fallbackModelId: currentSession.modelId,
        })
        : [currentSession.modelId];
    const selectedRootModelIds = resolvedModelIds.length > 0
        ? resolvedModelIds
        : [currentSession.modelId];
    const rootPrimaryModelId = selectedRootModelIds[0];
    const assistantMessageId = existingAssistantMessageId || (Date.now() + 1).toString();
    const roundId = isRootMultiModelSession ? `round-${Date.now()}-${assistantMessageId}` : undefined;
    if (skipUserMessageAdd && existingAssistantMessageId) {
        yield put(updateMessage({
            sessionId,
            messageId: assistantMessageId,
            content: '',
            modelId: isRootMultiModelSession ? rootPrimaryModelId : session.modelId,
            roundId,
        }));
    } else {
        yield put(addMessage({
            sessionId,
            message: {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                modelId: isRootMultiModelSession ? rootPrimaryModelId : session.modelId,
                roundId,
            },
        }));
    }

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
                        content: formatStreamFailure(assistantMsg.content, errMsg),
                        modelId: session.modelId,
                    }));
                }
            } finally {
                modelControllers.delete(session.modelId);
            }
            return;
        }

        const primaryModelId = rootPrimaryModelId;
        if (!roundId) return;

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

export function* handleRegenerateMessage(action: RegenerateMessageAction) {
    const state: RootState = yield select();
    const session = state.sessions.sessions[action.payload.sessionId];
    if (!session || session.isLoading) return;

    const assistantIndex = session.messages.findIndex((message) => message.id === action.payload.messageId);
    if (assistantIndex < 0) return;

    const previousUserMessage = findPreviousUserMessage(session.messages, action.payload.messageId);
    if (!previousUserMessage) return;

    yield put(sendMessage({
        sessionId: action.payload.sessionId,
        content: previousUserMessage.content,
        skipUserMessageAdd: true,
        assistantMessageId: action.payload.messageId,
        contextEndIndexExclusive: assistantIndex,
    }));
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
    yield takeEvery(sendMessage.type, handleSendMessage);
    yield takeEvery(regenerateMessage.type, handleRegenerateMessage);
    yield takeEvery(stopGenerating.type, handleStopGenerating);
}
