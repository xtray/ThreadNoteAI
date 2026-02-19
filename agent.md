# ThreadNote AI Agent Development Guide

## 1. Project Goal
ThreadNote AI is a React + Redux-Saga web client for LLM chat with:
- Main chat sessions
- Nested sub-sessions anchored to selected text in AI replies
- Notebook mode (Markdown notes from AI reply snippets or full replies)
- Local persistence (IndexedDB)
- Multi-provider model routing via API keys and model config

This document is for other AI agents/models to continue development safely.

## 2. Tech Stack
- Frontend: React 18 + TypeScript + Vite
- State: Redux Toolkit
- Async side effects: Redux Saga
- Markdown rendering: `react-markdown` + `remark-gfm`
- Icons: `lucide-react`
- Persistence:
  - IndexedDB (`src/utils/db.ts`) for sessions/messages/notes
  - `localStorage` for config/API keys (`src/store/slices/configSlice.ts`)

## 3. Runtime Architecture

### 3.1 Layered Structure
1. UI Layer
- `src/App.tsx`
- `src/components/**`

2. State Layer
- `src/store/slices/sessionSlice.ts`
- `src/store/slices/notesSlice.ts`
- `src/store/slices/configSlice.ts`

3. Orchestration Layer
- `src/store/sagas/aiSaga.ts`
- `src/store/sagas/persistenceSaga.ts`

4. Integration Layer
- `src/utils/api.ts` (LLM HTTP calls)
- `src/utils/models.ts` (provider/model registry)
- `src/utils/db.ts` (IndexedDB CRUD)

### 3.2 Call Graph (Core)
1. User send message
- `ChatContainer/FloatingOverlay` dispatches `sessions/sendMessage`
- `aiSaga`:
  - adds user message (`sessions/addMessage`)
  - sets loading
  - resolves model + provider API key
  - calls `callAI()`
  - adds assistant message or error/stop message

2. Persistence
- `persistenceSaga` listens to:
  - session mutations (`create/spawn/add/remove/...`)
  - notes mutations (`upsertNote`, `loadNotes`)
- writes full or partial state to IndexedDB via `db.ts`

3. Startup hydration
- `App.tsx` startup:
  - `initDB()`
  - `loadAllSessions()`
  - `loadAllNotes()`
  - dispatches `loadSessions`, `loadNotes`, `setActiveSession`
  - loads config from localStorage

## 4. Data Model

### 4.1 Session Model
File: `src/store/slices/sessionSlice.ts`
- `ChatSession`
  - `id`
  - `parentId` (null means root session)
  - `anchorText`, `anchorMessageId` (for sub-session source)
  - `messages[]`
  - `modelId`
  - `isLoading`

- `Message`
  - `role`: `user | assistant`
  - `content`
  - `annotations[]` (highlight anchors linked to sub-sessions)

### 4.2 Notes Model
File: `src/store/slices/notesSlice.ts`
- `Note`
  - `id`, `title`, `fileName`, `content`, `updatedAt`

## 5. Key Modules and Responsibilities

### 5.1 `src/App.tsx`
- Workspace mode switch: `AI | Notebook`
- Left sidebar lists chats or notes
- Context menus:
  - chat item: delete chat tree
  - note item: delete / export markdown
- Global modals:
  - clear chats
  - clear notes
  - delete note confirmation
  - notebook settings (export/import notes)

### 5.2 Chat UI
- `ChatContainer.tsx`
  - Main session message list + input + stop button

- `MessageItem.tsx`
  - Selection-to-sub-session creation
  - Main-session message context menu (delete turn / add to note)
  - Opens `FloatingOverlay` for sub-sessions

- `MessageContent.tsx`
  - Markdown rendering
  - `<think>...</think>` split + collapsible reasoning
  - Annotation highlight injection over rendered markdown
  - Annotation context menu (delete sub-session with custom confirm modal)

- `FloatingOverlay.tsx`
  - Sub-session chat panel with input + stop
  - Right-click and selection actions for adding to note
  - Add-to-note menu rendered by portal (`document.body`) to avoid clipping

### 5.3 Notebook UI
- `NotebookViewer.tsx`
  - Typora-like mode:
    - focus/edit: raw markdown textarea
    - blur/view: rendered markdown
  - autosave note content via `upsertNote`

## 6. API/Model Routing
- Provider and model definitions: `src/utils/models.ts`
- Request transport: `src/utils/api.ts` (OpenAI-compatible `/chat/completions`)
- Dev proxy: `vite.config.ts` routes:
  - `/api/minimax`
  - `/api/glm`
  - `/api/deepseek`
  - `/api/openai`

## 7. Persistence Details
- IndexedDB DB name: `threadnote-ai-indexeddb`
- Stores:
  - `sessions`
  - `messages`
  - `meta` (activeSessionId)
  - `notes`

Important helpers in `src/utils/db.ts`:
- Sessions:
  - `saveSession/saveMessage/saveActiveSessionId`
  - `replaceAllSessionsData`
  - `loadAllSessions`
  - `resetSessionDB`
- Notes:
  - `saveNote`
  - `replaceAllNotesData`
  - `loadAllNotes`
  - `resetNotesDB`

## 8. Notebook Import/Export Spec

### 8.1 Export All
- If File System Access API exists (`showDirectoryPicker`):
  - writes each note as `.md`
  - writes `threadnote-notes-export.json` manifest
- If unavailable:
  - downloads one JSON export file

### 8.2 Import
- Accepts JSON:
  - manifest format `{ format, version, notes: [] }`
  - plain note array
  - object map (values as notes)
- Current behavior: replace all current notes with imported notes.

## 9. Deployment & Run

### 9.1 Local Development
1. `npm install`
2. `npm run dev`
3. Open shown local URL (usually `http://localhost:5173`)

### 9.2 Production Build
1. `npm install`
2. `npm run build`
3. Output directory: `dist/`
4. Serve `dist/` using any static server (Nginx, Caddy, CDN, etc.)

### 9.3 Production API Notes
- Current proxy config in `vite.config.ts` is dev-server oriented.
- For production you should:
  - provide equivalent reverse proxy routes on your server, or
  - change frontend API base strategy to environment-based URLs.

## 10. High-Risk Areas for Future Changes
- Annotation highlight injection in `MessageContent.tsx`
  - DOM range operations are sensitive to markdown node structure.
- Right-click menus in overlay
  - keep portal rendering for reliable positioning.
- Session tree deletion
  - ensure `removeSessionTree/removeAnnotationAndSubSession/removeTurn` continue to keep persistence consistent.
- Notes replace flow
  - `loadNotes` now persists entire notes set; preserve this when refactoring.

## 11. Recommended Extension Directions
- Add import mode selection: `Merge` vs `Replace`
- Add optimistic toast system (success/error events)
- Add e2e tests around:
  - sub-session highlight lifecycle
  - note import/export
  - session persistence after restart
