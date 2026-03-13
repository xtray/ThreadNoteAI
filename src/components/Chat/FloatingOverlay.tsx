import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { X, Send, Square, Maximize2, Minimize2, Check, Copy } from 'lucide-react';
import MessageContent from './MessageContent';
import { setActiveNoteId, upsertNote } from '../../store/slices/notesSlice';
import { createPortal } from 'react-dom';
import { removeTurn, updateSessionContextMode, updateSessionModel } from '../../store/slices/sessionSlice';
import { getModelDisplayName, getModelOptions } from '../../utils/modelDisplay';
import TurnToolbar from './TurnToolbar';
import { buildTurnMarkdown, copyTextToClipboard, findTurnQuestionContent, stripThinkBlocks } from './turnUtils';
import { buildSelectionHighlightRects } from './subSessionSelection';
import {
    createCopyOnlySelectionFloatingActions,
    SelectionFloatingActionBar,
} from './selectionFloatingActions';
import {
    calculateOverlaySelectionActionPosition,
    translateViewportRectsToOverlay,
} from './overlaySelectionPosition';
import {
    getSelectionCopyDismissDelay,
    shouldDismissSelectionBeforeCopy,
} from './selectionCopyBehavior';
import { shouldPreserveSelectableReplyMouseDown } from './floatingOverlayInteraction';
import { clearBrowserSelection } from './browserSelection';
import { getTrimmedRangeText } from './rangeText';

interface FloatingOverlayProps {
    sessionId: string;
    onClose: () => void;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 250;
type ResizeHandleCorner = 'top-left' | 'bottom-left';

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
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [showSelectionActions, setShowSelectionActions] = useState(false);
    const [selectionActionPosition, setSelectionActionPosition] = useState({ top: 0, left: 0 });
    const [selectionHighlightRects, setSelectionHighlightRects] = useState<Array<{
        top: number;
        left: number;
        width: number;
        height: number;
    }>>([]);
    const [selectedText, setSelectedText] = useState('');
    const [copiedSelection, setCopiedSelection] = useState(false);
    const [contextMenu, setContextMenu] = useState<
        | { x: number; y: number; type: 'add-note'; selectedText: string; turnUserMessageId: string | null }
        | { x: number; y: number; type: 'delete-turn'; turnUserMessageId: string }
        | null
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
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number; corner: ResizeHandleCorner }>({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        corner: 'top-left',
    });
    const copyResetTimerRef = useRef<number | null>(null);
    const selectionCopyResetTimerRef = useRef<number | null>(null);

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
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [inputText]);

    useEffect(() => () => {
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
        }
    }, []);

    const clearSelectionOverlay = useCallback(() => {
        setShowSelectionActions(false);
        setSelectionHighlightRects([]);
        setSelectedText('');
        setCopiedSelection(false);
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
            selectionCopyResetTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const closeOnLeftMouseDown = (event: MouseEvent) => {
            if (event.button !== 0) return;
            const target = event.target as HTMLElement | null;
            if (shouldPreserveSelectableReplyMouseDown(target)) return;
            setContextMenu(null);
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
        };
        const closeOnScroll = () => {
            setContextMenu(null);
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
        };
        window.addEventListener('mousedown', closeOnLeftMouseDown, true);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            window.removeEventListener('mousedown', closeOnLeftMouseDown, true);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, [clearSelectionOverlay]);

    // ─── Drag-to-resize logic ───
    const handleResizeMouseDown = useCallback((corner: ResizeHandleCorner) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height,
            corner,
        };
    }, [size]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { x, y, w, h, corner } = resizeStartRef.current;
            const newW = Math.max(MIN_WIDTH, w - (e.clientX - x));
            const nextHeightDelta = corner === 'top-left'
                ? -(e.clientY - y)
                : e.clientY - y;
            const newH = Math.max(MIN_HEIGHT, h + nextHeightDelta);
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

    const insertNewLineAtCursor = () => {
        const el = inputRef.current;
        if (!el) return;
        const start = el.selectionStart ?? inputText.length;
        const end = el.selectionEnd ?? inputText.length;
        const nextText = `${inputText.slice(0, start)}\n${inputText.slice(end)}`;
        setInputText(nextText);
        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = start + 1;
            el.selectionEnd = start + 1;
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
        clearBrowserSelection(window.getSelection());
    }, [dispatch, getSessionTitle, notes, session]);

    const findTurnUserMessageId = useCallback((messageIndex: number) => {
        if (!session) return null;
        for (let i = messageIndex; i >= 0; i -= 1) {
            const current = session.messages[i];
            if (current?.role === 'user') {
                return current.id;
            }
        }
        return null;
    }, [session]);

    const handleAssistantContextMenu = useCallback((
        e: React.MouseEvent<HTMLElement>,
        excerpt: string,
        turnUserMessageId: string | null
    ) => {
        if (!excerpt) return;

        const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
        const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: adjustedX,
            y: e.clientY,
            type: 'add-note',
            selectedText: excerpt,
            turnUserMessageId,
        });
    }, []);

    const handleAssistantMessageContextMenu = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        messageContent: string,
        messageIndex: number
    ) => {
        const target = e.target as HTMLElement;
        // Let annotation marker keep its own context menu behavior.
        if (target.closest('.annotation-highlight')) return;

        const messageEl = e.currentTarget;
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const text = getTrimmedRangeText(range);
        const hasLocalSelection = !!range
            && text.length > 0
            && messageEl.contains(range.commonAncestorContainer);
        const excerpt = hasLocalSelection
            ? text
            : messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || messageContent.trim();
        if (!excerpt) return;

        handleAssistantContextMenu(e, excerpt, findTurnUserMessageId(messageIndex));
    }, [findTurnUserMessageId, handleAssistantContextMenu]);

    const handleAssistantMessageMouseUp = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        messageContent: string,
        _messageIndex: number
    ) => {
        const target = e.target as HTMLElement;
        if (target.closest('.annotation-highlight')) return;

        const messageEl = e.currentTarget;
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const text = getTrimmedRangeText(range);
        const hasLocalSelection = !!range
            && text.length > 0
            && messageEl.contains(range.commonAncestorContainer);
        if (!hasLocalSelection || !range) {
            clearSelectionOverlay();
            return;
        }

        const excerpt = text || messageContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || messageContent.trim();
        if (!excerpt) {
            clearSelectionOverlay();
            return;
        }

        const overlayRect = overlayRef.current?.getBoundingClientRect();
        if (!overlayRect) {
            clearSelectionOverlay();
            return;
        }

        const rect = range.getBoundingClientRect();
        const highlightRects = translateViewportRectsToOverlay(
            buildSelectionHighlightRects(
                Array.from(range.getClientRects()).map((clientRect) => ({
                    top: clientRect.top,
                    left: clientRect.left,
                    width: clientRect.width,
                    height: clientRect.height,
                }))
            ),
            overlayRect
        );
        const actionPosition = calculateOverlaySelectionActionPosition(rect, overlayRect);
        setContextMenu(null);
        setSelectedText(excerpt);
        setCopiedSelection(false);
        setSelectionHighlightRects(highlightRects);
        setSelectionActionPosition(actionPosition);
        setShowSelectionActions(true);
    }, [clearSelectionOverlay]);

    const handleUserMessageContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>, messageIndex: number) => {
        const turnUserMessageId = findTurnUserMessageId(messageIndex);
        if (!turnUserMessageId) return;

        const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
        const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: adjustedX,
            y: e.clientY,
            type: 'delete-turn',
            turnUserMessageId,
        });
    }, [findTurnUserMessageId]);

    const getAssistantTurnMarkdown = useCallback((assistantContent: string, assistantIndex: number, modelId?: string) => {
        if (!session) return null;
        const question = findTurnQuestionContent(session.messages, assistantIndex);
        if (!question) return null;
        const answer = stripThinkBlocks(assistantContent);
        if (!answer) return null;
        const modelName = getModelDisplayName(modelId || session.modelId, customProviders);
        return buildTurnMarkdown({ question, answer, modelName });
    }, [customProviders, session]);

    const handleCopyAssistantTurnMarkdown = useCallback(async (messageId: string, markdown: string) => {
        const copied = await copyTextToClipboard(markdown);
        if (!copied) return;
        setCopiedMessageId(messageId);
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
        copyResetTimerRef.current = window.setTimeout(() => {
            setCopiedMessageId(null);
            copyResetTimerRef.current = null;
        }, 1500);
    }, []);

    const handleCopySelection = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const text = selectedText.trim();
        if (!text) return;

        if (shouldDismissSelectionBeforeCopy('floating-overlay')) {
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
        }

        const copied = await copyTextToClipboard(text);
        if (!copied) return;

        const dismissDelay = getSelectionCopyDismissDelay('floating-overlay');
        if (dismissDelay === 0) {
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
            return;
        }

        setCopiedSelection(true);
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
        }
        selectionCopyResetTimerRef.current = window.setTimeout(() => {
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
            selectionCopyResetTimerRef.current = null;
        }, dismissDelay);
    }, [clearSelectionOverlay, selectedText]);

    const selectionFloatingActions = useMemo(() => createCopyOnlySelectionFloatingActions({
        onCopySelection: handleCopySelection,
        copiedSelection,
    }), [copiedSelection, handleCopySelection]);

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
                if (!shouldPreserveSelectableReplyMouseDown(target)) {
                    setContextMenu(null);
                }
            }}
            ref={overlayRef}
        >
            {/* Resize handles — only when not fullscreen */}
            {!isFullscreen && (
                <>
                    <div
                        className="overlay-resize-handle overlay-resize-handle-top-left"
                        onMouseDown={handleResizeMouseDown('top-left')}
                    />
                    <div
                        className="overlay-resize-handle overlay-resize-handle-bottom-left"
                        onMouseDown={handleResizeMouseDown('bottom-left')}
                    />
                </>
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
                {session.messages.map((m, index) => (
                    (() => {
                        const turnMarkdown = m.role === 'assistant'
                            ? getAssistantTurnMarkdown(m.content, index, m.modelId)
                            : null;
                        return (
                            <div
                                key={m.id}
                                className={`overlay-message ${m.role}${m.role === 'assistant' ? ' overlay-message-selectable' : ''}`}
                                onContextMenu={
                                    m.role === 'assistant'
                                        ? (e) => handleAssistantMessageContextMenu(e, m.content, index)
                                        : (e) => handleUserMessageContextMenu(e, index)
                                }
                                onMouseUp={
                                    m.role === 'assistant'
                                        ? (e) => handleAssistantMessageMouseUp(e, m.content, index)
                                        : undefined
                                }
                            >
                                <MessageContent
                                    content={m.content}
                                    annotations={m.annotations}
                                    enableCodeBlockCopy={m.role === 'assistant'}
                                />
                                {m.role === 'assistant' && turnMarkdown && (
                                    <TurnToolbar
                                        className="overlay-turn-toolbar"
                                        actions={[
                                            {
                                                id: `copy-turn-${m.id}`,
                                                label: copiedMessageId === m.id ? 'Copied' : 'Copy',
                                                icon: copiedMessageId === m.id ? <Check size={13} /> : <Copy size={13} />,
                                                onClick: () => handleCopyAssistantTurnMarkdown(m.id, turnMarkdown),
                                                title: 'Copy question + answer as Markdown',
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                        );
                    })()
                ))}
                {session.isLoading && (
                    <div className="overlay-message assistant">
                        <span className="loading-indicator">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {selectionHighlightRects.map((rect, index) => (
                <div
                    key={`${rect.top}-${rect.left}-${index}`}
                    className="floating-selection-highlight"
                    style={{
                        position: 'absolute',
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        zIndex: 1,
                    }}
                />
            ))}

            {showSelectionActions && (
                <div
                    className="floating-subsession-btn"
                    style={{
                        position: 'absolute',
                        top: selectionActionPosition.top,
                        left: selectionActionPosition.left,
                        transform: 'translateX(-50%)',
                        zIndex: 3100,
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <SelectionFloatingActionBar actions={selectionFloatingActions} />
                </div>
            )}

            <div className="overlay-input">
                <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        if (e.ctrlKey && e.key.toLowerCase() === 'j') {
                            e.preventDefault();
                            insertNewLineAtCursor();
                            return;
                        }
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask about this..."
                    disabled={session.isLoading}
                    rows={1}
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
                    {contextMenu.type === 'add-note' ? (
                        <>
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
                            {contextMenu.turnUserMessageId && (
                                <button
                                    className="danger-action"
                                    type="button"
                                    onClick={() => {
                                        if (!contextMenu.turnUserMessageId) return;
                                        dispatch(removeTurn({
                                            sessionId,
                                            messageId: contextMenu.turnUserMessageId,
                                        }));
                                        setContextMenu(null);
                                    }}
                                >
                                    Delete turn
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            className="danger-action"
                            type="button"
                            onClick={() => {
                                dispatch(removeTurn({
                                    sessionId,
                                    messageId: contextMenu.turnUserMessageId,
                                }));
                                setContextMenu(null);
                            }}
                        >
                            Delete turn
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default FloatingOverlay;
