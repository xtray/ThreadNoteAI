import initSqlJs from 'sql.js';
import { ChatSession, Message } from '../store/slices/sessionSlice';

let db: any = null;
const DB_STORAGE_KEY = 'wrapperai_sqlite_b64';

export const initDB = async () => {
  if (db) return db;
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });
  const saved = localStorage.getItem(DB_STORAGE_KEY);
  if (saved) {
    try {
      const binary = base64ToUint8Array(saved);
      db = new SQL.Database(binary);
    } catch {
      localStorage.removeItem(DB_STORAGE_KEY);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      parentId TEXT,
      anchorText TEXT,
      anchorMessageId TEXT,
      modelId TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER,
      annotations TEXT DEFAULT '[]',
      FOREIGN KEY(sessionId) REFERENCES sessions(id)
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Backward-compatible migration for older DBs.
  try {
    db.run(`ALTER TABLE messages ADD COLUMN annotations TEXT DEFAULT '[]';`);
  } catch {
    // ignore - column already exists
  }

  persistDB();
  return db;
};

const persistDB = () => {
  if (!db) return;
  try {
    const data = db.export() as Uint8Array;
    localStorage.setItem(DB_STORAGE_KEY, uint8ArrayToBase64(data));
  } catch {
    // ignore storage failures
  }
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const saveSession = (session: ChatSession) => {
  if (!db) return;
  db.run(
    "INSERT OR REPLACE INTO sessions (id, parentId, anchorText, anchorMessageId, modelId) VALUES (?, ?, ?, ?, ?)",
    [session.id, session.parentId, session.anchorText, session.anchorMessageId, session.modelId]
  );
  persistDB();
};

export const saveMessage = (sessionId: string, message: Message) => {
  if (!db) return;
  db.run(
    "INSERT OR REPLACE INTO messages (id, sessionId, role, content, timestamp, annotations) VALUES (?, ?, ?, ?, ?, ?)",
    [
      message.id,
      sessionId,
      message.role,
      message.content,
      message.timestamp,
      JSON.stringify(message.annotations || []),
    ]
  );
  persistDB();
};

export const saveActiveSessionId = (sessionId: string | null) => {
  if (!db) return;
  if (sessionId) {
    db.run(
      "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      ['activeSessionId', sessionId]
    );
  } else {
    db.run("DELETE FROM meta WHERE key = 'activeSessionId'");
  }
  persistDB();
};

export const replaceAllSessionsData = (
  sessions: Record<string, ChatSession>,
  activeSessionId: string | null
) => {
  if (!db) return;

  db.run("DELETE FROM messages");
  db.run("DELETE FROM sessions");
  db.run("DELETE FROM meta");

  Object.values(sessions).forEach((session) => {
    db.run(
      "INSERT OR REPLACE INTO sessions (id, parentId, anchorText, anchorMessageId, modelId) VALUES (?, ?, ?, ?, ?)",
      [session.id, session.parentId, session.anchorText, session.anchorMessageId, session.modelId]
    );
    session.messages.forEach((message) => {
      db.run(
        "INSERT OR REPLACE INTO messages (id, sessionId, role, content, timestamp, annotations) VALUES (?, ?, ?, ?, ?, ?)",
        [
          message.id,
          session.id,
          message.role,
          message.content,
          message.timestamp,
          JSON.stringify(message.annotations || []),
        ]
      );
    });
  });

  if (activeSessionId) {
    db.run(
      "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      ['activeSessionId', activeSessionId]
    );
  }

  persistDB();
};

export const resetSessionDB = async () => {
  localStorage.removeItem(DB_STORAGE_KEY);
  db = null;
  try {
    await initDB();
  } catch {
    // If re-init fails, UI state has already been cleared by caller.
  }
};

export const loadAllSessions = (): { sessions: Record<string, ChatSession>; activeSessionId: string | null } => {
  if (!db) return { sessions: {}, activeSessionId: null };

  const sessions: Record<string, ChatSession> = {};

  const sessionRows = db.exec("SELECT id, parentId, anchorText, anchorMessageId, modelId FROM sessions");
  if (sessionRows[0]) {
    const { values } = sessionRows[0];
    values.forEach((row: any[]) => {
      const [id, parentId, anchorText, anchorMessageId, modelId] = row;
      sessions[id] = {
        id,
        parentId,
        anchorText,
        anchorMessageId,
        modelId,
        isLoading: false,
        messages: [],
      };
    });
  }

  const messageRows = db.exec(
    "SELECT id, sessionId, role, content, timestamp, annotations FROM messages ORDER BY timestamp ASC"
  );
  if (messageRows[0]) {
    const { values } = messageRows[0];
    values.forEach((row: any[]) => {
      const [id, sessionId, role, content, timestamp, annotationsRaw] = row;
      if (!sessions[sessionId]) return;
      let annotations = [];
      try {
        annotations = annotationsRaw ? JSON.parse(annotationsRaw) : [];
      } catch {
        annotations = [];
      }
      sessions[sessionId].messages.push({
        id,
        role,
        content,
        timestamp,
        annotations,
      });
    });
  }

  let activeSessionId: string | null = null;
  const metaRows = db.exec("SELECT value FROM meta WHERE key = 'activeSessionId'");
  if (metaRows[0]?.values?.[0]?.[0]) {
    activeSessionId = metaRows[0].values[0][0] as string;
  }

  if (activeSessionId && !sessions[activeSessionId]) {
    activeSessionId = null;
  }

  return { sessions, activeSessionId };
};
