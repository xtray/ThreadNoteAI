import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { X, Send, Square, Maximize2, Minimize2 } from 'lucide-react';
import MessageContent from './MessageContent';
import { setActiveNoteId, upsertNote } from '../../store/slices/notesSlice';
import { createPortal } from 'react-dom';
import { updateSessionContextMode, updateSessionModel } from '../../store/slices/sessionSlice';
import { getModelDisplayName, getModelOptions } from '../../utils/modelDisplay';

interface FloatingOverlayProps {
    sessionId: string;
    onClose: () => void;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 250;

const FloatingOverlay: React.FC<FloatingOverlayProps> = ({ sessionId, onClose }) => {
    const CONTEXT_MENU_WIDTH = 160;
    const CONTEXT_MENU_MARGIN = 10;
    const dispatch = useDispatch();
    const session = useSelector((state: RootState) => state.sessions.sessions[sessionId]);
    const customProviders = useSelector((state: RootState) => state.config.customProviders);
    const modelOptions = getModelOptions(customProviders);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const [inputText, setInputText] = useState('');
    const [pendingSentText, setPendingSentText] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [size, setSize] = useState({ width: 380, height: 500 });
    const [isResizing, setIsResizing] = useState(false);
    const [contextMenu, setContextMenu] = useState<
        { x: number; y: number; selectedText: string } | null
    >(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousScrollStateRef = useRef<{
        sessionId: string;
        messageCount: number;
        lastMessageId: string | null;
        lastMessageContent: string;
        isLoading: boolean;
    } | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

    useEffect(() => {
        if (!session) {
            previousScrollStateRef.current = null;
            return;
        }

        const lastMessage = session.messages[session.messages.length - 1];
        const nextState = {
            sessionId: session.id,
            messageCount: session.messages.length,
            lastMessageId: lastMessage?.id ?? null,
            lastMessageContent: lastMessage?.content ?? '',
            isLoading: session.isLoading,
        };

        const previous = previousScrollStateRef.current;
        if (!previous) {
            previousScrollStateRef.current = nextState;
            return;
        }

        const sessionChanged = previous.sessionId !== nextState.sessionId;
        const messageCountIncreased = !!previous && nextState.messageCount > previous.messageCount;
        const loadingStarted = !!previous && !previous.isLoading && nextState.isLoading;
        const loadingMessageUpdated = !!previous
            && nextState.isLoading
            && previous.lastMessageId === nextState.lastMessageId
            && previous.lastMessageContent !== nextState.lastMessageContent;

        if ((sessionChanged && nextState.messageCount > 0) || messageCountIncreased || loadingStarted || loadingMessageUpdated) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        previousScrollStateRef.current = nextState;
    }, [session?.id, session?.isLoading, session?.messages]);

    useEffect(() => {
        if (!session) return;
        if (session.messages.length === 0) {
            setInputText(session.anchorText || '');
        }
    }, [sessionId, session]);

    useEffect(() => {
        if (!session) return;
        if (pendingSentText && session.isLoading) {
            setInputText('');
            setPendingSentText(null);
        }
    }, [session, pendingSentText]);

    useEffect(() => {
        const closeOnLeftMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest('.message-context-menu')) return;
            setContextMenu(null);
        };
        const closeOnScroll = () => setContextMenu(null);
        window.addEventListener('mousedown', closeOnLeftMouseDown, true);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            window.removeEventListener('mousedown', closeOnLeftMouseDown, true);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, []);

    // ─── Drag-to-resize logic ───
    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height,
        };
    }, [size]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { x, y, w, h } = resizeStartRef.current;
            // Resize from top-left corner (overlay is positioned at right side)
            const newW = Math.max(MIN_WIDTH, w - (e.clientX - x));
            const newH = Math.max(MIN_HEIGHT, h - (e.clientY - y));
            setSize({ width: newW, height: newH });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleSend = () => {
        if (!inputText.trim() || session?.isLoading) return;
        const draft = inputText;
        dispatch({
            type: 'sessions/sendMessage',
            payload: { sessionId, content: draft },
        });
        setPendingSentText(draft);
    };

    const handleStop = () => {
        dispatch({
            type: 'sessions/stopGenerating',
            payload: { sessionId },
        });
    };

    const getSessionTitle = useCallback(() => {
        if (!session) return 'Sub-session';
        const firstUser = session.messages.find((m) => m.role === 'user' && m.content.trim().length > 0);
        const base = firstUser?.content || session.anchorText || 'Sub-session';
        const singleLine = base.replace(/\s+/g, ' ').trim();
        return singleLine.length > 100 ? `${singleLine.slice(0, 100)}...` : singleLine;
    }, [session]);

    const sanitizeFileName = (text: string) => {
        const base = text
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .trim()
            .slice(0, 64);
        return base || 'note';
    };

    const addToSessionNote = useCallback((excerpt: string) => {
        if (!session) return;
        const title = getSessionTitle();
        const noteId = `note-session-${session.id}`;
        const fileName = `${sanitizeFileName(title)}.md`;
        const existing = notes[noteId];
        const timestamp = new Date().toLocaleString();
        const block = `\n\n## Excerpt (${timestamp})\n\n${excerpt.trim()}\n`;
        const content = existing
            ? `${existing.content}${block}`
            : `# ${title}\n\n${block.trimStart()}`;

        dispatch(upsertNote({
            id: noteId,
            title,
            fileName,
            content,
            updatedAt: Date.now(),
        }));
        dispatch(setActiveNoteId(noteId));
        window.getSelection()?.removeAllRanges();
    }, [dispatch, getSessionTitle, notes, session]);

    const handleAssistantContextMenu = useCallback((e: React.MouseEvent<HTMLElement>, excerpt: string) => {
        if (!excerpt) return;

        const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
        const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: adjustedX,
            y: e.clientY,
            selectedText: excerpt,
        });
    }, []);

    const handleAssistantMessageContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>, messageContent: string) => {
        const target = e.target as HTMLElement;
        // Let annotation marker keep its own context menu behavior.
        if (target.closest('.annotation-highlight')) return;

        const messageEl = e.currentTarget;
        const selection = window.getSelection();
        const text = selection?.toString() || '';
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const hasLocalSelection = !!range
            && text.trim().length > 0
            && messageEl.contains(range.commonAncestorContainer);
        const excerpt = hasLocalSelection
            ? text.trim()
            : messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || messageContent.trim();
        if (!excerpt) return;

        handleAssistantContextMenu(e, excerpt);
    }, [handleAssistantContextMenu]);

    const handleAssistantMessageMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>, messageContent: string) => {
        const target = e.target as HTMLElement;
        if (target.closest('.annotation-highlight')) return;

        const messageEl = e.currentTarget;
        const selection = window.getSelection();
        const text = selection?.toString() || '';
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const hasLocalSelection = !!range
            && text.trim().length > 0
            && messageEl.contains(range.commonAncestorContainer);
        if (!hasLocalSelection) return;

        const excerpt = text.trim() || messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || messageContent.trim();
        if (!excerpt) return;

        const rect = range.getBoundingClientRect();
        const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
        const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(rect.left + rect.width / 2, maxX));
        setContextMenu({
            x: adjustedX,
            y: Math.max(CONTEXT_MENU_MARGIN, rect.bottom + 8),
            selectedText: excerpt,
        });
    }, []);

    if (!session) return null;

    const anchorText = session.anchorText || '';

    const overlayStyle: React.CSSProperties = isFullscreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
            zIndex: 3000,
        }
        : {
            width: size.width,
            height: size.height,
        };

    return (
        <div
            className={`floating-overlay ${isFullscreen ? 'fullscreen' : ''}`}
            style={overlayStyle}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => {
                if (e.button !== 0 || !contextMenu) return;
                const target = e.target as HTMLElement;
                if (!target.closest('.message-context-menu')) {
                    setContextMenu(null);
                }
            }}
            ref={overlayRef}
        >
            {/* Resize handle (top-left corner) — only when not fullscreen */}
            {!isFullscreen && (
                <div
                    className="overlay-resize-handle"
                    onMouseDown={handleResizeMouseDown}
                />
            )}

            <div className="overlay-header">
                <span title={anchorText}>
                    "{anchorText.length > 40 ? anchorText.slice(0, 40) + '…' : anchorText}"
                </span>
                <div className="overlay-header-actions">
                    <button
                        className="overlay-action-btn"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button className="overlay-action-btn" onClick={onClose} title="Close">
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="overlay-model-badge">
                <select
                    className="overlay-model-select"
                    value={session.modelId}
                    onChange={(e) =>
                        dispatch(updateSessionModel({ sessionId: session.id, modelId: e.target.value }))
                    }
                    disabled={session.isLoading}
                    title={getModelDisplayName(session.modelId, customProviders)}
                >
                    <optgroup label="Built-in">
                        {modelOptions.builtIn.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.displayName}
                            </option>
                        ))}
                    </optgroup>
                    {modelOptions.custom.length > 0 && (
                        <optgroup label="Custom">
                            {modelOptions.custom.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.displayName}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
                {session.parentId !== null && (
                    <div className="overlay-context-mode">
                        <button
                            className={session.contextMode === 'keep' ? 'mode-btn active' : 'mode-btn'}
                            onClick={() => dispatch(updateSessionContextMode({ sessionId: session.id, contextMode: 'keep' }))}
                            disabled={session.isLoading}
                            title="Use main chat snapshot + sub-session history"
                        >
                            Keep
                        </button>
                        <button
                            className={session.contextMode === 'keep' ? 'mode-btn' : 'mode-btn active'}
                            onClick={() => dispatch(updateSessionContextMode({ sessionId: session.id, contextMode: 'new' }))}
                            disabled={session.isLoading}
                            title="Use only sub-session history"
                        >
                            New
                        </button>
                    </div>
                )}
            </div>

            <div className="overlay-messages">
                {session.messages.map((m) => (
                    <div
                        key={m.id}
                        className={`overlay-message ${m.role}`}
                        onContextMenu={
                            m.role === 'assistant'
                                ? (e) => handleAssistantMessageContextMenu(e, m.content)
                                : undefined
                        }
                        onMouseUp={
                            m.role === 'assistant'
                                ? (e) => handleAssistantMessageMouseUp(e, m.content)
                                : undefined
                        }
                    >
                        <MessageContent
                            content={m.content}
                            annotations={m.annotations}
                            onResponseContextMenu={
                                m.role === 'assistant'
                                    ? handleAssistantContextMenu
                                    : undefined
                            }
                        />
                    </div>
                ))}
                {session.isLoading && (
                    <div className="overlay-message assistant">
                        <span className="loading-indicator">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="overlay-input">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask about this..."
                    disabled={session.isLoading}
                />
                <button
                    className={`overlay-send-btn ${session.isLoading ? 'is-stop' : ''}`}
                    onClick={session.isLoading ? handleStop : handleSend}
                    disabled={!session.isLoading && !inputText.trim()}
                    title={session.isLoading ? 'Stop generating' : 'Send'}
                >
                    {session.isLoading ? (
                        <>
                            <Square size={13} />
                            <span>Stop</span>
                        </>
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </div>
            {contextMenu && createPortal(
                <div
                    className="message-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="note-action"
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={() => {
                            setContextMenu(null);
                            addToSessionNote(contextMenu.selectedText);
                        }}
                    >
                        Add to note
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default FloatingOverlay;
