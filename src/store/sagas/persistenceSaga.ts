import { call, select, takeEvery } from 'redux-saga/effects';
import { RootState } from '..';
import { initDB, replaceAllNotesData, replaceAllSessionsData, saveActiveSessionId, saveMessage, saveNote, saveSession } from '../../utils/db';
import { ChatSession, Message } from '../slices/sessionSlice';
import { Note } from '../slices/notesSlice';

function* persistCreatedSession(action: { payload: ChatSession }) {
    try {
        yield call(initDB);
        yield call(saveSession, action.payload);
        yield call(saveActiveSessionId, action.payload.id);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistSpawnedSession(action: { payload: ChatSession }) {
    try {
        yield call(initDB);
        yield call(saveSession, action.payload);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistMessage(action: { payload: { sessionId: string; message: Message } }) {
    try {
        yield call(initDB);
        const state: RootState = yield select();
        const session = state.sessions.sessions[action.payload.sessionId];
        if (session) {
            yield call(saveSession, session);
        }
        yield call(saveMessage, action.payload.sessionId, action.payload.message);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistAnnotatedMessage(action: { payload: { sessionId: string; messageId: string } }) {
    try {
        yield call(initDB);
        const state: RootState = yield select();
        const session = state.sessions.sessions[action.payload.sessionId];
        const message = session?.messages.find((m) => m.id === action.payload.messageId);
        if (!message) return;
        yield call(saveMessage, action.payload.sessionId, message);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistSessionModelChange(action: { payload: { sessionId: string } }) {
    try {
        yield call(initDB);
        const state: RootState = yield select();
        const session = state.sessions.sessions[action.payload.sessionId];
        if (session) {
            yield call(saveSession, session);
        }
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistActiveSession(action: { payload: string | null }) {
    try {
        yield call(initDB);
        yield call(saveActiveSessionId, action.payload);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistRemovedSubSession() {
    try {
        yield call(initDB);
        const state: RootState = yield select();
        yield call(
            replaceAllSessionsData,
            state.sessions.sessions,
            state.sessions.activeSessionId
        );
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistNote(action: { payload: Note }) {
    try {
        yield call(initDB);
        yield call(saveNote, action.payload);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

function* persistLoadedNotes(action: { payload: Record<string, Note> }) {
    try {
        yield call(initDB);
        yield call(replaceAllNotesData, action.payload);
    } catch {
        // Keep app flow alive even if persistence fails temporarily.
    }
}

export function* persistenceSaga() {
    yield takeEvery('sessions/createSession' as any, persistCreatedSession as any);
    yield takeEvery('sessions/spawnSession' as any, persistSpawnedSession as any);
    yield takeEvery('sessions/addMessage' as any, persistMessage as any);
    yield takeEvery('sessions/addAnnotation' as any, persistAnnotatedMessage as any);
    yield takeEvery('sessions/updateMessage' as any, persistAnnotatedMessage as any);
    yield takeEvery('sessions/updateSessionModel' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/updateSessionContextMode' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/setSessionMultiReplyEnabled' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/initializeMultiModelRound' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/upsertMultiModelRoundReply' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/setMultiModelActiveTab' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/setMultiModelPrimaryModel' as any, persistSessionModelChange as any);
    yield takeEvery('sessions/removeAnnotationAndSubSession' as any, persistRemovedSubSession as any);
    yield takeEvery('sessions/removeSessionTree' as any, persistRemovedSubSession as any);
    yield takeEvery('sessions/removeTurn' as any, persistRemovedSubSession as any);
    yield takeEvery('sessions/setActiveSession' as any, persistActiveSession as any);
    yield takeEvery('notes/upsertNote' as any, persistNote as any);
    yield takeEvery('notes/loadNotes' as any, persistLoadedNotes as any);
}
