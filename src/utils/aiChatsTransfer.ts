import { SessionState } from '../store/slices/sessionSlice';

export type AiChatsExportPayload = {
    format: 'threadnote-ai-chats-export';
    version: 1;
    exportedAt: string;
    activeSessionId: string | null;
    sessions: SessionState['sessions'];
};

const resolveSafeActiveSessionId = (
    sessions: SessionState['sessions'],
    preferredActiveSessionId: string | null
) => {
    if (preferredActiveSessionId && sessions[preferredActiveSessionId]) {
        return preferredActiveSessionId;
    }

    const firstRootSession = Object.values(sessions).find((session) => session.parentId === null);
    if (firstRootSession) {
        return firstRootSession.id;
    }

    return Object.keys(sessions)[0] ?? null;
};

export const exportAiChats = (state: SessionState): AiChatsExportPayload => ({
    format: 'threadnote-ai-chats-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    activeSessionId: state.activeSessionId,
    sessions: state.sessions,
});

export const overwriteImportedChats = (
    _current: SessionState,
    imported: SessionState
): SessionState => ({
    sessions: imported.sessions,
    activeSessionId: resolveSafeActiveSessionId(imported.sessions, imported.activeSessionId),
});

export const mergeImportedChats = (
    current: SessionState,
    imported: SessionState
): SessionState => {
    const sessions = {
        ...current.sessions,
        ...imported.sessions,
    };

    return {
        sessions,
        activeSessionId: resolveSafeActiveSessionId(
            sessions,
            current.activeSessionId && sessions[current.activeSessionId]
                ? current.activeSessionId
                : imported.activeSessionId
        ),
    };
};
