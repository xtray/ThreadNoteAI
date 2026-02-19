import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    annotations?: MessageAnnotation[];
}

export interface MessageAnnotation {
    id: string;
    subSessionId: string;
    anchorText: string;
    createdAt: number;
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
}

export interface SessionState {
    activeSessionId: string | null;
    sessions: Record<string, ChatSession>;
}

const initialState: SessionState = {
    activeSessionId: null,
    sessions: {},
}

const sessionSlice = createSlice({
    name: 'sessions',
    initialState,
    reducers: {
        createSession: (state, action: PayloadAction<ChatSession>) => {
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
            state.sessions[action.payload.id] = action.payload
        },
        loadSessions: (state, action: PayloadAction<Record<string, ChatSession>>) => {
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
        updateSessionContextMode: (
            state,
            action: PayloadAction<{ sessionId: string; contextMode: 'new' | 'keep' }>
        ) => {
            const session = state.sessions[action.payload.sessionId];
            if (session) {
                session.contextMode = action.payload.contextMode;
            }
        },
        updateMessage: (state, action: PayloadAction<{ sessionId: string; messageId: string; content: string }>) => {
            const session = state.sessions[action.payload.sessionId];
            if (session) {
                const msg = session.messages.find(m => m.id === action.payload.messageId);
                if (msg) {
                    msg.content = action.payload.content;
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
        removeTurn: (state, action: PayloadAction<{ sessionId: string; userMessageId: string }>) => {
            const { sessionId, userMessageId } = action.payload;
            const session = state.sessions[sessionId];
            if (!session) return;

            const userIndex = session.messages.findIndex((m) => m.id === userMessageId && m.role === 'user');
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
    updateSessionContextMode,
    updateMessage,
    addAnnotation,
    removeAnnotationAndSubSession,
    removeSessionTree,
    removeTurn,
    stopGenerating,
} = sessionSlice.actions
export default sessionSlice.reducer
