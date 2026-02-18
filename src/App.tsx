import React, { useEffect, useState } from 'react'
import './App.css'
import ChatContainer from './components/Chat/ChatContainer'
import SettingsPanel from './components/Settings/SettingsPanel'
import { initDB, loadAllSessions, resetSessionDB } from './utils/db'
import { useDispatch, useSelector } from 'react-redux'
import { loadConfig, toggleSettings } from './store/slices/configSlice'
import { createSession, loadSessions, removeSessionTree, setActiveSession } from './store/slices/sessionSlice'
import { RootState } from './store'
import { Plus, Settings, Trash2 } from 'lucide-react'

function App() {
    const dispatch = useDispatch();
    const sessions = useSelector((state: RootState) => state.sessions.sessions);
    const activeSessionId = useSelector((state: RootState) => state.sessions.activeSessionId);
    const mainModelId = useSelector((state: RootState) => state.config.mainModelId);
    const [historyMenu, setHistoryMenu] = useState<{
        x: number;
        y: number;
        sessionId: string;
    } | null>(null);
    const [clearModalOpen, setClearModalOpen] = useState(false);
    const [isClearingChats, setIsClearingChats] = useState(false);

    const rootSessions = Object.values(sessions)
        .filter((s) => s.parentId === null)
        .sort((a, b) => {
            const aTs = a.messages[a.messages.length - 1]?.timestamp ?? Number(a.id) ?? 0;
            const bTs = b.messages[b.messages.length - 1]?.timestamp ?? Number(b.id) ?? 0;
            return bTs - aTs;
        });

    const getSessionTitle = (sessionId: string) => {
        const session = sessions[sessionId];
        if (!session) return 'New chat';
        const firstUser = session.messages.find((m) => m.role === 'user');
        if (!firstUser?.content) return 'New chat';
        const singleLine = firstUser.content.replace(/\s+/g, ' ').trim();
        return singleLine.length > 36 ? `${singleLine.slice(0, 36)}...` : singleLine;
    };

    useEffect(() => {
        const startup = async () => {
            try {
                await initDB();
                const { sessions, activeSessionId } = loadAllSessions();
                dispatch(loadSessions(sessions));
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
        const closeMenu = () => setHistoryMenu(null);
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, []);

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

        // Immediate UI update for responsive UX.
        dispatch(loadSessions({}));
        dispatch(setActiveSession(null));
        setHistoryMenu(null);
        setClearModalOpen(false);

        await resetSessionDB();
        setIsClearingChats(false);
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <h1>WrapperAI</h1>
                <button className="new-chat-btn" onClick={handleNewChat}>
                    <Plus size={16} />
                    <span>New Chat</span>
                </button>
                <div className="history-list">
                    {rootSessions.map((session) => (
                        <button
                            key={session.id}
                            className={`history-item ${session.id === activeSessionId ? 'active' : ''}`}
                            onClick={() => dispatch(setActiveSession(session.id))}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHistoryMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    sessionId: session.id,
                                });
                            }}
                            title={getSessionTitle(session.id)}
                        >
                            {getSessionTitle(session.id)}
                        </button>
                    ))}
                </div>
                <div className="sidebar-spacer" />
                <button className="clear-history-btn" onClick={() => setClearModalOpen(true)}>
                    <Trash2 size={16} />
                    <span>Clear All Chats</span>
                </button>
                <button className="settings-btn" onClick={() => dispatch(toggleSettings())}>
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </aside>
            <main className="chat-main">
                <ChatContainer />
            </main>
            <SettingsPanel />
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
        </div>
    )
}

export default App
