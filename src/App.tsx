import React, { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import ChatContainer from './components/Chat/ChatContainer'
import SettingsPanel from './components/Settings/SettingsPanel'
import SidebarTitleBar from './components/Settings/SidebarTitleBar'
import { initDB, loadAllNotes, loadAllSessions, replaceAllSessionsData, resetSessionDB } from './utils/db'
import { useDispatch, useSelector } from 'react-redux'
import { loadConfig, replaceAiConfig, toggleSettings } from './store/slices/configSlice'
import { createSession, loadSessions, removeSessionTree, setActiveSession } from './store/slices/sessionSlice'
import { RootState } from './store'
import { loadNotes, Note, setActiveNoteId } from './store/slices/notesSlice'
import { BookOpenText, MessageSquare, Plus, Settings, Trash2 } from 'lucide-react'
import NotebookViewer from './components/Notebook/NotebookViewer'
import { buildChatSidebarResult, buildNoteSidebarResult, getSessionTitle, SidebarResult } from './utils/sidebarSearch';
import { DEFAULT_SIDEBAR_WIDTH, clampSidebarWidth, loadSidebarWidth, saveSidebarWidth } from './utils/sidebarWidth';
import { guardCtrlWheelZoom } from './utils/wheelZoomGuard';
import { exportAiConfig, importAiConfigPayload } from './utils/aiConfigTransfer';
import { exportAiChats, mergeImportedChats, overwriteImportedChats } from './utils/aiChatsTransfer';
import type { SettingsAiTabId, SettingsPrimaryTabId } from './components/Settings/SettingsPanel';

type WorkspaceMode = 'ai' | 'notebook';

type NotesExportManifest = {
    format: 'threadnote-notes-export';
    version: 1;
    exportedAt: string;
    notes: Note[];
};

const CONTEXT_MENU_WIDTH = 180;
const CONTEXT_MENU_MARGIN = 10;

export const renderSidebarLabel = (itemId: string, result: SidebarResult) => (
    <span className="history-item-label">
        {result.segments.map((segment, index) => (
            <span
                key={`${itemId}-${index}`}
                className={segment.matched ? 'history-item-highlight' : undefined}
            >
                {segment.text}
            </span>
        ))}
    </span>
);

function App() {
    const dispatch = useDispatch();
    const sessions = useSelector((state: RootState) => state.sessions.sessions);
    const activeSessionId = useSelector((state: RootState) => state.sessions.activeSessionId);
    const config = useSelector((state: RootState) => state.config);
    const mainModelId = useSelector((state: RootState) => state.config.mainModelId);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const activeNoteId = useSelector((state: RootState) => state.notes.activeNoteId);

    const [historyMenu, setHistoryMenu] = useState<{
        x: number;
        y: number;
        sessionId: string;
    } | null>(null);
    const [noteMenu, setNoteMenu] = useState<{
        x: number;
        y: number;
        noteId: string;
    } | null>(null);

    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [isClearingChats, setIsClearingChats] = useState(false);
    const [clearNotesModalOpen, setClearNotesModalOpen] = useState(false);
    const [isClearingNotes, setIsClearingNotes] = useState(false);
    const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

    const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('ai');
    const [notebookSettingsHint, setNotebookSettingsHint] = useState('');
    const [settingsPrimaryTab, setSettingsPrimaryTab] = useState<SettingsPrimaryTabId>('general');
    const [settingsAiTab, setSettingsAiTab] = useState<SettingsAiTabId>('models');
    const [chatSearch, setChatSearch] = useState('');
    const [noteSearch, setNoteSearch] = useState('');
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;
        return loadSidebarWidth(window.localStorage, window.innerWidth);
    });
    const [isSidebarResizing, setIsSidebarResizing] = useState(false);
    const sidebarWidthRef = useRef(sidebarWidth);
    const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aiConfigImportRef = useRef<HTMLInputElement>(null);
    const aiChatsOverwriteImportRef = useRef<HTMLInputElement>(null);
    const aiChatsMergeImportRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const workspaceMainRef = useRef<HTMLElement | null>(null);

    const rootSessions = Object.values(sessions)
        .filter((s) => s.parentId === null)
        .sort((a, b) => {
            const aTs = a.messages[a.messages.length - 1]?.timestamp ?? Number(a.id) ?? 0;
            const bTs = b.messages[b.messages.length - 1]?.timestamp ?? Number(b.id) ?? 0;
            return bTs - aTs;
        });

    const sortedNotes = useMemo(
        () => Object.values(notes).sort((a, b) => b.updatedAt - a.updatedAt),
        [notes]
    );
    const activeNote = activeNoteId ? notes[activeNoteId] || null : null;
    const visibleChatResults = useMemo(
        () => rootSessions
            .map((session) => ({
                sessionId: session.id,
                result: buildChatSidebarResult(session, chatSearch),
            }))
            .filter((item): item is { sessionId: string; result: NonNullable<typeof item.result> } => item.result !== null),
        [chatSearch, rootSessions]
    );
    const visibleNoteResults = useMemo(
        () => sortedNotes
            .map((note) => ({
                noteId: note.id,
                result: buildNoteSidebarResult(note, noteSearch),
            }))
            .filter((item): item is { noteId: string; result: NonNullable<typeof item.result> } => item.result !== null),
        [noteSearch, sortedNotes]
    );

    const sanitizeFileName = (text: string) => {
        const base = text
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .trim()
            .slice(0, 64);
        return base || 'note';
    };

    const downloadTextFile = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadJsonFile = (payload: unknown, fileName: string) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const openUnifiedSettings = (primaryTab: SettingsPrimaryTabId, aiTab: SettingsAiTabId = 'models') => {
        setSettingsPrimaryTab(primaryTab);
        setSettingsAiTab(aiTab);
        if (!config.settingsOpen) {
            dispatch(toggleSettings());
        }
    };

    useEffect(() => {
        sidebarWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    useEffect(() => {
        const startup = async () => {
            try {
                await initDB();
                const { sessions, activeSessionId } = await loadAllSessions();
                const loadedNotes = await loadAllNotes();
                dispatch(loadSessions(sessions));
                dispatch(loadNotes(loadedNotes));
                if (activeSessionId) {
                    dispatch(setActiveSession(activeSessionId));
                } else {
                    const firstSessionId = Object.keys(sessions).find((id) => sessions[id].parentId === null)
                        || Object.keys(sessions)[0];
                    if (firstSessionId) {
                        dispatch(setActiveSession(firstSessionId));
                    }
                }
            } catch (error) {
                console.error('Failed to initialize local DB, continuing with empty sessions.', error);
                dispatch(loadSessions({}));
                dispatch(setActiveSession(null));
            }
            dispatch(loadConfig());
        };
        startup();
    }, [dispatch]);

    useEffect(() => {
        const closeMenus = () => {
            setHistoryMenu(null);
            setNoteMenu(null);
        };
        window.addEventListener('click', closeMenus);
        window.addEventListener('scroll', closeMenus, true);
        return () => {
            window.removeEventListener('click', closeMenus);
            window.removeEventListener('scroll', closeMenus, true);
        };
    }, []);

    useEffect(() => {
        const sidebarElement = sidebarRef.current;
        const workspaceElement = workspaceMainRef.current;
        const elements = [sidebarElement, workspaceElement].filter((value): value is HTMLElement => value !== null);
        if (elements.length === 0) return;

        const handleWheel = (event: WheelEvent) => {
            guardCtrlWheelZoom(event);
        };

        elements.forEach((element) => {
            element.addEventListener('wheel', handleWheel, { passive: false });
        });

        return () => {
            elements.forEach((element) => {
                element.removeEventListener('wheel', handleWheel);
            });
        };
    }, []);

    useEffect(() => {
        if (!isSidebarResizing) return;

        const handlePointerMove = (event: PointerEvent) => {
            const resizeState = sidebarResizeRef.current;
            if (!resizeState) return;
            const nextWidth = clampSidebarWidth(
                resizeState.startWidth + (event.clientX - resizeState.startX),
                window.innerWidth
            );
            sidebarWidthRef.current = nextWidth;
            setSidebarWidth(nextWidth);
        };

        const handlePointerUp = () => {
            saveSidebarWidth(window.localStorage, sidebarWidthRef.current, window.innerWidth);
            sidebarResizeRef.current = null;
            setIsSidebarResizing(false);
        };

        document.body.classList.add('is-resizing-sidebar');
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.body.classList.remove('is-resizing-sidebar');
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isSidebarResizing]);

    useEffect(() => {
        const handleWindowResize = () => {
            const nextWidth = clampSidebarWidth(sidebarWidthRef.current, window.innerWidth);
            if (nextWidth === sidebarWidthRef.current) return;
            sidebarWidthRef.current = nextWidth;
            setSidebarWidth(nextWidth);
            saveSidebarWidth(window.localStorage, nextWidth, window.innerWidth);
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);

    const handleSidebarResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        sidebarResizeRef.current = {
            startX: event.clientX,
            startWidth: sidebarWidthRef.current,
        };
        setIsSidebarResizing(true);
    };

    const handleNewChat = () => {
        const id = Date.now().toString();
        dispatch(createSession({
            id,
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            messages: [],
            modelId: mainModelId,
            isLoading: false,
        }));
    };

    const handleClearHistory = async () => {
        if (isClearingChats) return;
        setIsClearingChats(true);

        dispatch(loadSessions({}));
        dispatch(setActiveSession(null));
        setHistoryMenu(null);
        setClearModalOpen(false);
        if (workspaceMode === 'notebook') {
            setWorkspaceMode('ai');
        }

        try {
            await resetSessionDB();
        } catch (error) {
            console.error('Failed to clear local chat history.', error);
        } finally {
            setIsClearingChats(false);
        }
    };

    const handleDeleteNote = (noteId: string) => {
        const nextNotes = { ...notes };
        delete nextNotes[noteId];
        dispatch(loadNotes(nextNotes));

        if (activeNoteId === noteId) {
            const fallback = Object.keys(nextNotes)[0] ?? null;
            dispatch(setActiveNoteId(fallback));
        }
    };

    const handleExportNote = (noteId: string) => {
        const note = notes[noteId];
        if (!note) return;
        const safeFileName = note.fileName?.endsWith('.md')
            ? note.fileName
            : `${sanitizeFileName(note.title)}.md`;
        downloadTextFile(note.content, safeFileName);
    };

    const handleClearAllNotes = () => {
        if (isClearingNotes) return;
        setIsClearingNotes(true);
        dispatch(loadNotes({}));
        dispatch(setActiveNoteId(null));
        setClearNotesModalOpen(false);
        setIsClearingNotes(false);
    };

    const handleExportAllNotes = async () => {
        const notesArray = sortedNotes;
        if (notesArray.length === 0) {
            setNotebookSettingsHint('No notes to export.');
            return;
        }

        const payload: NotesExportManifest = {
            format: 'threadnote-notes-export',
            version: 1,
            exportedAt: new Date().toISOString(),
            notes: notesArray,
        };

        const showDirectoryPicker = (window as any).showDirectoryPicker as undefined | (() => Promise<any>);
        if (!showDirectoryPicker) {
            const fileName = `threadnote-notes-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            setNotebookSettingsHint('Directory picker not available. Exported as a JSON file instead.');
            return;
        }

        try {
            const dirHandle = await showDirectoryPicker();
            const usedNames = new Set<string>();

            const writeTextFile = async (fileName: string, content: string) => {
                const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
            };

            for (const note of notesArray) {
                const rawName = note.fileName || `${sanitizeFileName(note.title)}.md`;
                const normalized = rawName.endsWith('.md') ? rawName : `${rawName}.md`;
                let finalName = normalized;
                let i = 1;
                while (usedNames.has(finalName)) {
                    const stem = normalized.replace(/\.md$/i, '');
                    finalName = `${stem}-${i}.md`;
                    i += 1;
                }
                usedNames.add(finalName);
                await writeTextFile(finalName, note.content);
            }

            await writeTextFile('threadnote-notes-export.json', JSON.stringify(payload, null, 2));
            setNotebookSettingsHint(`Exported ${notesArray.length} notes.`);
        } catch (error) {
            console.error('Failed to export notes:', error);
            setNotebookSettingsHint('Export canceled or failed.');
        }
    };

    const handleImportNotes = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);

            const arr: unknown = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.notes)
                    ? parsed.notes
                    : Object.values(parsed || {});

            const imported = (arr as any[])
                .filter((n) => n && typeof n === 'object' && typeof n.content === 'string')
                .map((n, idx) => {
                    const title = typeof n.title === 'string' && n.title.trim() ? n.title.trim() : `Imported Note ${idx + 1}`;
                    const id = typeof n.id === 'string' && n.id.trim() ? n.id : `imported-note-${Date.now()}-${idx}`;
                    const fileName = typeof n.fileName === 'string' && n.fileName.trim()
                        ? n.fileName
                        : `${sanitizeFileName(title)}.md`;
                    const updatedAt = typeof n.updatedAt === 'number' ? n.updatedAt : Date.now();
                    return {
                        id,
                        title,
                        fileName,
                        content: n.content as string,
                        updatedAt,
                    } as Note;
                });

            if (imported.length === 0) {
                setNotebookSettingsHint('No valid notes found in this file.');
                return;
            }

            const map = imported.reduce<Record<string, Note>>((acc, note) => {
                acc[note.id] = note;
                return acc;
            }, {});

            dispatch(loadNotes(map));
            dispatch(setActiveNoteId(imported[0].id));
            setNotebookSettingsHint(`Imported ${imported.length} notes.`);
        } catch (error) {
            console.error('Failed to import notes:', error);
            setNotebookSettingsHint('Import failed. Please choose a valid export JSON file.');
        }
    };

    const handleExportAiConfig = () => {
        const payload = exportAiConfig(config);
        downloadJsonFile(
            payload,
            `threadnote-ai-config-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
        );
    };

    const handleImportAiConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);
            const nextConfig = importAiConfigPayload(parsed, config);
            dispatch(replaceAiConfig(nextConfig));
        } catch (error) {
            console.error('Failed to import AI config:', error);
        }
    };

    const parseImportedSessions = (payload: unknown) => {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid AI chats payload');
        }

        const candidate = payload as {
            sessions?: RootState['sessions']['sessions'];
            activeSessionId?: string | null;
        };

        if (!candidate.sessions || typeof candidate.sessions !== 'object') {
            throw new Error('Missing sessions payload');
        }

        return {
            sessions: candidate.sessions,
            activeSessionId: typeof candidate.activeSessionId === 'string' ? candidate.activeSessionId : null,
        };
    };

    const handleExportAiChats = () => {
        const payload = exportAiChats({
            sessions,
            activeSessionId,
        });
        downloadJsonFile(
            payload,
            `threadnote-ai-chats-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
        );
    };

    const handleImportAiChats = async (
        event: React.ChangeEvent<HTMLInputElement>,
        mode: 'overwrite' | 'merge'
    ) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);
            const importedState = parseImportedSessions(parsed);
            const currentState = { sessions, activeSessionId };
            const nextState = mode === 'overwrite'
                ? overwriteImportedChats(currentState, importedState)
                : mergeImportedChats(currentState, importedState);

            dispatch(loadSessions(nextState.sessions));
            dispatch(setActiveSession(nextState.activeSessionId));
            await replaceAllSessionsData(nextState.sessions, nextState.activeSessionId);
        } catch (error) {
            console.error(`Failed to ${mode} AI chats import:`, error);
        }
    };

    return (
        <div className="app-container">
            <aside ref={sidebarRef} className="sidebar" style={{ width: `${sidebarWidth}px` }}>
                <SidebarTitleBar onOpenSettings={() => openUnifiedSettings('general')} />
                <div className="left-mode-tabs">
                    <button
                        className={`left-mode-tab ${workspaceMode === 'ai' ? 'active' : ''}`}
                        onClick={() => setWorkspaceMode('ai')}
                    >
                        <MessageSquare size={14} />
                        <span>AI</span>
                    </button>
                    <button
                        className={`left-mode-tab ${workspaceMode === 'notebook' ? 'active' : ''}`}
                        onClick={() => setWorkspaceMode('notebook')}
                    >
                        <BookOpenText size={14} />
                        <span>Notebook</span>
                    </button>
                </div>

                {workspaceMode === 'ai' ? (
                    <>
                        <button className="new-chat-btn" onClick={handleNewChat}>
                            <Plus size={16} />
                            <span>New Chat</span>
                        </button>
                        <input
                            className="sidebar-search-input"
                            type="search"
                            placeholder="Search chats"
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                        />
                        <div className="history-list">
                            {visibleChatResults.length === 0 ? (
                                <div className="sidebar-empty-state">No chats match this search.</div>
                            ) : (
                                visibleChatResults.map(({ sessionId, result }) => (
                                    <button
                                        key={sessionId}
                                        className={`history-item ${sessionId === activeSessionId ? 'active' : ''}`}
                                        onClick={() => dispatch(setActiveSession(sessionId))}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
                                            const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));
                                            setHistoryMenu({
                                                x: adjustedX,
                                                y: e.clientY,
                                                sessionId,
                                            });
                                        }}
                                        title={getSessionTitle(sessions[sessionId])}
                                    >
                                        {renderSidebarLabel(sessionId, result)}
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="sidebar-spacer" />
                        <button className="clear-history-btn" onClick={() => setClearModalOpen(true)}>
                            <Trash2 size={16} />
                            <span>Clear All Chats</span>
                        </button>
                        <button className="settings-btn" onClick={() => openUnifiedSettings('ai', 'models')}>
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            className="sidebar-search-input"
                            type="search"
                            placeholder="Search notes"
                            value={noteSearch}
                            onChange={(e) => setNoteSearch(e.target.value)}
                        />
                        <div className="history-list note-history-list">
                            {sortedNotes.length === 0 ? (
                                <div className="notes-empty">
                                    <p>No notes yet.</p>
                                    <p>Right click AI response text and choose Add to note.</p>
                                </div>
                            ) : visibleNoteResults.length === 0 ? (
                                <div className="sidebar-empty-state">No notes match this search.</div>
                            ) : (
                                visibleNoteResults.map(({ noteId, result }) => (
                                    <button
                                        key={noteId}
                                        className={`history-item ${activeNoteId === noteId ? 'active' : ''}`}
                                        onClick={() => dispatch(setActiveNoteId(noteId))}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
                                            const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));
                                            setNoteMenu({ x: adjustedX, y: e.clientY, noteId });
                                        }}
                                        title={notes[noteId]?.title ?? ''}
                                    >
                                        {renderSidebarLabel(noteId, result)}
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="sidebar-spacer" />
                        <button className="clear-history-btn" onClick={() => setClearNotesModalOpen(true)}>
                            <Trash2 size={16} />
                            <span>Clear All Notes</span>
                        </button>
                        <button className="settings-btn" onClick={() => openUnifiedSettings('notebook')}>
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                    </>
                )}
            </aside>
            <div
                className={`sidebar-resize-handle ${isSidebarResizing ? 'is-active' : ''}`}
                onPointerDown={handleSidebarResizeStart}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
            />
            <main className="chat-main">
                <section ref={workspaceMainRef} className="workspace-main">
                    {workspaceMode === 'ai' ? (
                        <ChatContainer searchQuery={chatSearch} />
                    ) : (
                        <NotebookViewer note={activeNote} searchQuery={noteSearch} />
                    )}
                </section>
            </main>
            <SettingsPanel
                initialPrimaryTab={settingsPrimaryTab}
                initialAiTab={settingsAiTab}
                notebookSettingsProps={{
                    onExportAllNotes: handleExportAllNotes,
                    onImportNotesClick: () => fileInputRef.current?.click(),
                    importInputRef: fileInputRef,
                    onImportNotesChange: handleImportNotes,
                    hint: notebookSettingsHint,
                }}
                aiDataSettingsProps={{
                    onExportAiConfig: handleExportAiConfig,
                    onImportAiConfig: () => aiConfigImportRef.current?.click(),
                    onExportAiChats: handleExportAiChats,
                    onOverwriteAiChats: () => aiChatsOverwriteImportRef.current?.click(),
                    onMergeAiChats: () => aiChatsMergeImportRef.current?.click(),
                }}
            />
            <input
                ref={aiConfigImportRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportAiConfig}
            />
            <input
                ref={aiChatsOverwriteImportRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(event) => void handleImportAiChats(event, 'overwrite')}
            />
            <input
                ref={aiChatsMergeImportRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(event) => void handleImportAiChats(event, 'merge')}
            />

            {historyMenu && (
                <div
                    className="history-context-menu"
                    style={{ top: historyMenu.y, left: historyMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            dispatch(removeSessionTree({ sessionId: historyMenu.sessionId }));
                            setHistoryMenu(null);
                        }}
                    >
                        Delete Chat
                    </button>
                </div>
            )}

            {noteMenu && (
                <div
                    className="history-context-menu"
                    style={{ top: noteMenu.y, left: noteMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteNoteId(noteMenu.noteId);
                            setNoteMenu(null);
                        }}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            handleExportNote(noteMenu.noteId);
                            setNoteMenu(null);
                        }}
                    >
                        Export Markdown
                    </button>
                </div>
            )}

            {clearModalOpen && (
                <div className="confirm-modal-backdrop" onClick={() => setClearModalOpen(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Clear all chats?</h3>
                        <p>This will permanently remove all chats, sub-sessions, and annotations from local storage.</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-cancel-btn" onClick={() => setClearModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="confirm-danger-btn" onClick={handleClearHistory} disabled={isClearingChats}>
                                {isClearingChats ? 'Clearing...' : 'Clear All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteNoteId && (
                <div className="confirm-modal-backdrop" onClick={() => setDeleteNoteId(null)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete this note?</h3>
                        <p>This action cannot be undone.</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-cancel-btn" onClick={() => setDeleteNoteId(null)}>
                                Cancel
                            </button>
                            <button
                                className="confirm-danger-btn"
                                onClick={() => {
                                    handleDeleteNote(deleteNoteId);
                                    setDeleteNoteId(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {clearNotesModalOpen && (
                <div className="confirm-modal-backdrop" onClick={() => setClearNotesModalOpen(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Clear all notes?</h3>
                        <p>This will permanently remove all notebook items from local storage.</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-cancel-btn" onClick={() => setClearNotesModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="confirm-danger-btn" onClick={handleClearAllNotes} disabled={isClearingNotes}>
                                {isClearingNotes ? 'Clearing...' : 'Clear All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
