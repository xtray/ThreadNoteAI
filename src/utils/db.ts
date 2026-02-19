import { ChatSession, Message } from '../store/slices/sessionSlice';
import { Note } from '../store/slices/notesSlice';

const DB_NAME = 'threadnote-ai-indexeddb';
const DB_VERSION = 2;
const SESSIONS_STORE = 'sessions';
const MESSAGES_STORE = 'messages';
const META_STORE = 'meta';
const NOTES_STORE = 'notes';

interface StoredSession {
  id: string;
  parentId: string | null;
  anchorText: string | null;
  anchorMessageId: string | null;
  modelId: string;
  contextMode?: 'new' | 'keep';
  mainContextSnapshotMessages?: Message[];
}

interface StoredMessage extends Message {
  sessionId: string;
}

type StoredNote = Note;

let dbPromise: Promise<IDBDatabase> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });

const transactionDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });

const openDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messages = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messages.createIndex('sessionId', 'sessionId', { unique: false });
        messages.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notes = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        notes.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB();
  }
  return dbPromise;
};

export const initDB = async () => getDB();

export const saveSession = async (session: ChatSession) => {
  const db = await getDB();
  const tx = db.transaction(SESSIONS_STORE, 'readwrite');
  const store = tx.objectStore(SESSIONS_STORE);
  const record: StoredSession = {
    id: session.id,
    parentId: session.parentId,
    anchorText: session.anchorText,
    anchorMessageId: session.anchorMessageId,
    modelId: session.modelId,
    contextMode: session.contextMode,
    mainContextSnapshotMessages: session.mainContextSnapshotMessages || [],
  };
  store.put(record);
  await transactionDone(tx);
};

export const saveMessage = async (sessionId: string, message: Message) => {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readwrite');
  const store = tx.objectStore(MESSAGES_STORE);
  const record: StoredMessage = {
    ...message,
    sessionId,
    annotations: message.annotations || [],
  };
  store.put(record);
  await transactionDone(tx);
};

export const saveActiveSessionId = async (sessionId: string | null) => {
  const db = await getDB();
  const tx = db.transaction(META_STORE, 'readwrite');
  const store = tx.objectStore(META_STORE);
  if (sessionId) {
    store.put({ key: 'activeSessionId', value: sessionId });
  } else {
    store.delete('activeSessionId');
  }
  await transactionDone(tx);
};

export const replaceAllSessionsData = async (
  sessions: Record<string, ChatSession>,
  activeSessionId: string | null
) => {
  const db = await getDB();
  const tx = db.transaction([SESSIONS_STORE, MESSAGES_STORE, META_STORE], 'readwrite');
  const sessionsStore = tx.objectStore(SESSIONS_STORE);
  const messagesStore = tx.objectStore(MESSAGES_STORE);
  const metaStore = tx.objectStore(META_STORE);

  sessionsStore.clear();
  messagesStore.clear();
  metaStore.clear();

  Object.values(sessions).forEach((session) => {
    sessionsStore.put({
      id: session.id,
      parentId: session.parentId,
      anchorText: session.anchorText,
      anchorMessageId: session.anchorMessageId,
      modelId: session.modelId,
      contextMode: session.contextMode,
      mainContextSnapshotMessages: session.mainContextSnapshotMessages || [],
    } as StoredSession);

    session.messages.forEach((message) => {
      messagesStore.put({
        ...message,
        sessionId: session.id,
        annotations: message.annotations || [],
      } as StoredMessage);
    });
  });

  if (activeSessionId) {
    metaStore.put({ key: 'activeSessionId', value: activeSessionId });
  }

  await transactionDone(tx);
};

export const resetSessionDB = async () => {
  const db = await getDB();
  const tx = db.transaction([SESSIONS_STORE, MESSAGES_STORE, META_STORE], 'readwrite');
  tx.objectStore(SESSIONS_STORE).clear();
  tx.objectStore(MESSAGES_STORE).clear();
  tx.objectStore(META_STORE).clear();
  await transactionDone(tx);
};

export const loadAllSessions = async (): Promise<{ sessions: Record<string, ChatSession>; activeSessionId: string | null }> => {
  const db = await getDB();
  const tx = db.transaction([SESSIONS_STORE, MESSAGES_STORE, META_STORE], 'readonly');
  const sessionsStore = tx.objectStore(SESSIONS_STORE);
  const messagesStore = tx.objectStore(MESSAGES_STORE);
  const metaStore = tx.objectStore(META_STORE);

  const storedSessions = await requestToPromise<StoredSession[]>(sessionsStore.getAll());
  const storedMessages = await requestToPromise<StoredMessage[]>(messagesStore.getAll());
  const activeMeta = await requestToPromise<{ key: string; value: string } | undefined>(
    metaStore.get('activeSessionId')
  );

  const sessions: Record<string, ChatSession> = {};
  storedSessions.forEach((s) => {
    sessions[s.id] = {
      id: s.id,
      parentId: s.parentId,
      anchorText: s.anchorText,
      anchorMessageId: s.anchorMessageId,
      modelId: s.modelId,
      isLoading: false,
      messages: [],
      contextMode: s.contextMode,
      mainContextSnapshotMessages: s.mainContextSnapshotMessages || [],
    };
  });

  storedMessages
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((m) => {
      if (!sessions[m.sessionId]) return;
      sessions[m.sessionId].messages.push({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        annotations: m.annotations || [],
      });
    });

  let activeSessionId = activeMeta?.value ?? null;
  if (activeSessionId && !sessions[activeSessionId]) {
    activeSessionId = null;
  }

  await transactionDone(tx);
  return { sessions, activeSessionId };
};

export const saveNote = async (note: Note) => {
  const db = await getDB();
  const tx = db.transaction(NOTES_STORE, 'readwrite');
  tx.objectStore(NOTES_STORE).put(note as StoredNote);
  await transactionDone(tx);
};

export const replaceAllNotesData = async (notes: Record<string, Note>) => {
  const db = await getDB();
  const tx = db.transaction(NOTES_STORE, 'readwrite');
  const notesStore = tx.objectStore(NOTES_STORE);
  notesStore.clear();
  Object.values(notes).forEach((note) => {
    notesStore.put(note as StoredNote);
  });
  await transactionDone(tx);
};

export const resetNotesDB = async () => {
  const db = await getDB();
  const tx = db.transaction(NOTES_STORE, 'readwrite');
  tx.objectStore(NOTES_STORE).clear();
  await transactionDone(tx);
};

export const loadAllNotes = async (): Promise<Record<string, Note>> => {
  const db = await getDB();
  const tx = db.transaction(NOTES_STORE, 'readonly');
  const notesStore = tx.objectStore(NOTES_STORE);
  const notes = await requestToPromise<StoredNote[]>(notesStore.getAll());
  await transactionDone(tx);

  return notes.reduce<Record<string, Note>>((acc, note) => {
    acc[note.id] = note;
    return acc;
  }, {});
};
