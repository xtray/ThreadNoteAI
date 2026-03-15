import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    annotations?: MessageAnnotation[];
    modelId?: string;
    roundId?: string;
}

export interface MessageAnnotation {
    id: string;
    subSessionId: string;
    anchorText: string;
    anchorOccurrence?: number;
    createdAt: number;
}

export type MultiModelReplyStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface MultiModelRoundReply {
    content: string;
    status: MultiModelReplyStatus;
}

export interface MultiModelRound {
    id: string;
    modelOrder: string[];
    modelReplies: Record<string, MultiModelRoundReply>;
}

export interface MultiModelSessionState {
    rounds: Record<string, MultiModelRound>;
    activeRoundId: string | null;
    activeTabModelId: string | null;
    roundActiveTabModelIds: Record<string, string>;
    primaryModelId: string | null;
    lastUsedSelectedModelIds: string[];
}

export interface ChatSession {
    id: string;
    parentId: string | null;
    anchorText: string | null;
    anchorMessageId: string | null;
    messages: Message[];
    modelId: string;
    isLoading: boolean;
    contextMode?: 'new' | 'keep';
    mainContextSnapshotMessages?: Message[];
    multiModel?: MultiModelSessionState;
    multiReplyEnabled?: boolean;
}

export interface SessionState {
    activeSessionId: string | null;
    sessions: Record<string, ChatSession>;
}

const initialState: SessionState = {
    activeSessionId: null,
    sessions: {},
}

const uniqueNonEmptyModelIds = (modelIds: string[]) => {
    const deduped = new Set<string>();
    modelIds.forEach((id) => {
        if (id) {
            deduped.add(id);
        }
    });
    return [...deduped];
};

const ensureRootMultiModelState = (session: ChatSession) => {
    if (session.parentId !== null) {
        return null;
    }
    if (!session.multiModel) {
        session.multiModel = {
            rounds: {},
            activeRoundId: null,
            activeTabModelId: null,
            roundActiveTabModelIds: {},
            primaryModelId: null,
            lastUsedSelectedModelIds: [],
        };
    } else if (!session.multiModel.roundActiveTabModelIds) {
        session.multiModel.roundActiveTabModelIds = {};
    }
    return session.multiModel;
};

const ensureRootSessionDefaults = (session: ChatSession) => {
    if (session.parentId !== null) return;
    if (typeof session.multiReplyEnabled !== 'boolean') {
        session.multiReplyEnabled = true;
    }
    if (session.multiModel && !session.multiModel.roundActiveTabModelIds) {
        session.multiModel.roundActiveTabModelIds = {};
        if (session.multiModel.activeRoundId && session.multiModel.activeTabModelId) {
            session.multiModel.roundActiveTabModelIds[session.multiModel.activeRoundId] = session.multiModel.activeTabModelId;
        }
    }
};

const sessionSlice = createSlice({
    name: 'sessions',
    initialState,
    reducers: {
        createSession: (state, action: PayloadAction<ChatSession>) => {
            ensureRootSessionDefaults(action.payload);
            state.sessions[action.payload.id] = action.payload
            state.activeSessionId = action.payload.id
        },
        addMessage: (state, action: PayloadAction<{ sessionId: string; message: Message }>) => {
            const session = state.sessions[action.payload.sessionId]
            if (session) {
                session.messages.push(action.payload.message)
            }
        },
        setActiveSession: (state, action: PayloadAction<string | null>) => {
            state.activeSessionId = action.payload
        },
        spawnSession: (state, action: PayloadAction<ChatSession>) => {
            ensureRootSessionDefaults(action.payload);
            state.sessions[action.payload.id] = action.payload
        },
        loadSessions: (state, action: PayloadAction<Record<string, ChatSession>>) => {
            Object.values(action.payload).forEach((session) => {
                ensureRootSessionDefaults(session);
            });
            state.sessions = action.payload
        },
        setSessionLoading: (state, action: PayloadAction<{ sessionId: string; isLoading: boolean }>) => {
            const session = state.sessions[action.payload.sessionId]
            if (session) {
                session.isLoading = action.payload.isLoading
            }
        },
        updateSessionModel: (state, action: PayloadAction<{ sessionId: string; modelId: string }>) => {
            const session = state.sessions[action.payload.sessionId];
            if (session) {
                session.modelId = action.payload.modelId;
            }
        },
        initializeMultiModelRound: (
            state,
            action: PayloadAction<{
                sessionId: string;
                roundId: string;
                selectedModelIds: string[];
                primaryModelId?: string;
            }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;

            const multiModel = ensureRootMultiModelState(session);
            if (!multiModel) return;

            const selectedModelIds = uniqueNonEmptyModelIds(action.payload.selectedModelIds);
            if (selectedModelIds.length === 0) return;

            const primaryModelId = action.payload.primaryModelId && selectedModelIds.includes(action.payload.primaryModelId)
                ? action.payload.primaryModelId
                : selectedModelIds[0];

            const modelReplies: Record<string, MultiModelRoundReply> = {};
            selectedModelIds.forEach((modelId) => {
                modelReplies[modelId] = { content: '', status: 'idle' };
            });

            multiModel.rounds[action.payload.roundId] = {
                id: action.payload.roundId,
                modelOrder: selectedModelIds,
                modelReplies,
            };
            multiModel.activeRoundId = action.payload.roundId;
            multiModel.primaryModelId = primaryModelId;
            multiModel.lastUsedSelectedModelIds = selectedModelIds;
            const activeTabModelId =
                multiModel.activeTabModelId && selectedModelIds.includes(multiModel.activeTabModelId)
                    ? multiModel.activeTabModelId
                    : primaryModelId;
            multiModel.activeTabModelId = activeTabModelId;
            multiModel.roundActiveTabModelIds[action.payload.roundId] = activeTabModelId;
            session.modelId = primaryModelId;
        },
        upsertMultiModelRoundReply: (
            state,
            action: PayloadAction<{
                sessionId: string;
                roundId: string;
                modelId: string;
                content?: string;
                status?: MultiModelReplyStatus;
            }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;

            const multiModel = ensureRootMultiModelState(session);
            if (!multiModel) return;

            const round = multiModel.rounds[action.payload.roundId] || {
                id: action.payload.roundId,
                modelOrder: [],
                modelReplies: {},
            };
            if (!round.modelOrder.includes(action.payload.modelId)) {
                round.modelOrder.push(action.payload.modelId);
            }

            const prevReply = round.modelReplies[action.payload.modelId] || { content: '', status: 'idle' as const };
            round.modelReplies[action.payload.modelId] = {
                content: action.payload.content ?? prevReply.content,
                status: action.payload.status ?? prevReply.status,
            };

            multiModel.rounds[action.payload.roundId] = round;
            if (!multiModel.activeRoundId) {
                multiModel.activeRoundId = action.payload.roundId;
            }
        },
        setMultiModelActiveTab: (
            state,
            action: PayloadAction<{ sessionId: string; modelId: string; roundId?: string }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;

            const multiModel = ensureRootMultiModelState(session);
            if (!multiModel) return;

            const roundId = action.payload.roundId || multiModel.activeRoundId;
            if (!roundId) return;
            const round = multiModel.rounds[roundId];
            if (!round || !round.modelOrder.includes(action.payload.modelId)) return;

            multiModel.roundActiveTabModelIds[roundId] = action.payload.modelId;
            if (multiModel.activeRoundId === roundId) {
                multiModel.activeTabModelId = action.payload.modelId;
            }
        },
        setMultiModelPrimaryModel: (
            state,
            action: PayloadAction<{ sessionId: string; modelId: string }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;

            const multiModel = ensureRootMultiModelState(session);
            if (!multiModel) return;

            multiModel.primaryModelId = action.payload.modelId;
            if (!multiModel.activeTabModelId) {
                multiModel.activeTabModelId = action.payload.modelId;
            }
            if (!multiModel.lastUsedSelectedModelIds.includes(action.payload.modelId)) {
                multiModel.lastUsedSelectedModelIds.push(action.payload.modelId);
            }
            if (multiModel.activeRoundId) {
                const tabModelId = multiModel.activeTabModelId || action.payload.modelId;
                multiModel.roundActiveTabModelIds[multiModel.activeRoundId] = tabModelId;
            }
            session.modelId = action.payload.modelId;
        },
        setSessionMultiReplyEnabled: (
            state,
            action: PayloadAction<{ sessionId: string; enabled: boolean }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session || session.parentId !== null) return;
            session.multiReplyEnabled = action.payload.enabled;
        },
        updateSessionContextMode: (
            state,
            action: PayloadAction<{ sessionId: string; contextMode: 'new' | 'keep' }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (session) {
                session.contextMode = action.payload.contextMode;
            }
        },
        updateMessage: (
            state,
            action: PayloadAction<{
                sessionId: string;
                messageId: string;
                content: string;
                modelId?: string;
                roundId?: string;
            }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (session) {
                const msg = session.messages.find(m => m.id === action.payload.messageId);
                if (msg) {
                    msg.content = action.payload.content;
                    if (typeof action.payload.modelId === 'string') {
                        msg.modelId = action.payload.modelId;
                    }
                    if (typeof action.payload.roundId === 'string') {
                        msg.roundId = action.payload.roundId;
                    }
                }
            }
        },
        addAnnotation: (state, action: PayloadAction<{ sessionId: string; messageId: string; annotation: MessageAnnotation }>) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;
            const msg = session.messages.find((m) => m.id === action.payload.messageId);
            if (!msg) return;
            if (!msg.annotations) {
                msg.annotations = [];
            }
            msg.annotations.push(action.payload.annotation);
        },
        removeAnnotationAndSubSession: (state, action: PayloadAction<{
            sessionId: string;
            messageId: string;
            annotationId: string;
            subSessionId: string;
        }>) => {
            const { sessionId, messageId, annotationId, subSessionId } = action.payload;
            const session = state.sessions[sessionId];
            if (!session) return;

            const msg = session.messages.find((m) => m.id === messageId);
            if (!msg?.annotations) return;

            msg.annotations = msg.annotations.filter((a) => a.id !== annotationId);

            const toDelete = collectSubSessionTree(state.sessions, subSessionId);
            toDelete.forEach((id) => {
                delete state.sessions[id];
            });
            if (state.activeSessionId && toDelete.has(state.activeSessionId)) {
                state.activeSessionId = sessionId;
            }
        },
        removeSessionTree: (state, action: PayloadAction<{ sessionId: string }>) => {
            const targetSessionId = action.payload.sessionId;
            const toDelete = collectSubSessionTree(state.sessions, targetSessionId);
            toDelete.forEach((id) => {
                delete state.sessions[id];
            });
            if (state.activeSessionId && toDelete.has(state.activeSessionId)) {
                const nextRootSession = Object.values(state.sessions).find((s) => s.parentId === null);
                state.activeSessionId = nextRootSession?.id ?? null;
            }
        },
        removeTurn: (state, action: PayloadAction<{ sessionId: string; messageId: string }>) => {
            const { sessionId, messageId } = action.payload;
            const session = state.sessions[sessionId];
            if (!session) return;

            const clickedIndex = session.messages.findIndex((m) => m.id === messageId);
            if (clickedIndex < 0) return;

            let userIndex = clickedIndex;
            if (session.messages[clickedIndex].role !== 'user') {
                userIndex = -1;
                for (let i = clickedIndex - 1; i >= 0; i -= 1) {
                    if (session.messages[i].role === 'user') {
                        userIndex = i;
                        break;
                    }
                }
            }
            if (userIndex < 0) return;

            const userMessage = session.messages[userIndex];
            const nextMessage = session.messages[userIndex + 1];
            const hasAssistantReply = nextMessage?.role === 'assistant';
            const messagesToRemove = [userMessage, ...(hasAssistantReply ? [nextMessage] : [])];

            const subRoots = new Set<string>();
            messagesToRemove.forEach((msg) => {
                msg.annotations?.forEach((annotation) => {
                    subRoots.add(annotation.subSessionId);
                });
            });

            const toDelete = new Set<string>();
            subRoots.forEach((rootId) => {
                const tree = collectSubSessionTree(state.sessions, rootId);
                tree.forEach((id) => toDelete.add(id));
            });
            toDelete.forEach((id) => {
                delete state.sessions[id];
            });

            session.messages.splice(userIndex, hasAssistantReply ? 2 : 1);
        },
        removeMessage: (state, action: PayloadAction<{ sessionId: string; messageId: string }>) => {
            const session = state.sessions[action.payload.sessionId];
            if (!session) return;

            session.messages = session.messages.filter((message) => message.id !== action.payload.messageId);
        },
        sendMessage: (
            _state,
            _action: PayloadAction<{
                sessionId: string;
                content: string;
                selectedModelIds?: string[];
                skipUserMessageAdd?: boolean;
                assistantMessageId?: string;
                contextEndIndexExclusive?: number;
            }>
        ) => {
            // handled by saga
        },
        regenerateMessage: (
            _state,
            _action: PayloadAction<{ sessionId: string; messageId: string }>
        ) => {
            // handled by saga
        },
        stopGenerating: () => {
            // handled by saga
        },
    },
})

const collectSubSessionTree = (
    sessions: Record<string, ChatSession>,
    rootSessionId: string
) => {
    const result = new Set<string>();
    const queue = [rootSessionId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || result.has(currentId)) continue;
        const currentSession = sessions[currentId];
        if (!currentSession) continue;
        result.add(currentId);
        currentSession.messages.forEach((m) => {
            m.annotations?.forEach((a) => {
                if (!result.has(a.subSessionId)) {
                    queue.push(a.subSessionId);
                }
            });
        });
    }

    return result;
};

export const {
    createSession,
    addMessage,
    setActiveSession,
    spawnSession,
    loadSessions,
    setSessionLoading,
    updateSessionModel,
    initializeMultiModelRound,
    upsertMultiModelRoundReply,
    setMultiModelActiveTab,
    setMultiModelPrimaryModel,
    setSessionMultiReplyEnabled,
    updateSessionContextMode,
    updateMessage,
    addAnnotation,
    removeAnnotationAndSubSession,
    removeSessionTree,
    removeTurn,
    removeMessage,
    sendMessage,
    regenerateMessage,
    stopGenerating,
} = sessionSlice.actions
export default sessionSlice.reducer
