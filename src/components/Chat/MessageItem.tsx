import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message, spawnSession, addAnnotation, regenerateMessage, removeAnnotationAndSubSession, removeTurn } from '../../store/slices/sessionSlice';
import { RootState } from '../../store';
import FloatingOverlay from './FloatingOverlay';
import MessageContent from './MessageContent';
import TurnToolbar from './TurnToolbar';
import type { TurnToolbarAction } from './TurnToolbar';
import {
    buildSelectionHighlightRects,
    shouldIgnoreSubSessionMouseUpStateReset,
    shouldShowSubSessionOverlay,
} from './subSessionSelection';
import {
    createSelectionFloatingActions,
    SelectionFloatingActionBar,
} from './selectionFloatingActions';
import { getSelectionCopyDismissDelay } from './selectionCopyBehavior';
import { setActiveNoteId, upsertNote } from '../../store/slices/notesSlice';
import { getModelDisplayName } from '../../utils/modelDisplay';
import { buildTurnMarkdown, copyTextToClipboard, findTurnQuestionContent, stripThinkBlocks } from './turnUtils';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { clearBrowserSelection } from './browserSelection';
import { getTrimmedRangeText } from './rangeText';
import { resolveSelectionAnchorOccurrence } from './selectionAnchorOccurrence';

interface MessageItemProps {
    message: Message;
    sessionId: string;
    messageIndex?: number;
    searchQuery?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, sessionId, messageIndex, searchQuery = '' }) => {
    const CONTEXT_MENU_WIDTH = 160;
    const CONTEXT_MENU_MARGIN = 10;
    const dispatch = useDispatch();
    const subModelId = useSelector((state: RootState) => state.config.subModelId);
    const subSessionContextMode = useSelector((state: RootState) => state.config.subSessionContextMode);
    const customProviders = useSelector((state: RootState) => state.config.customProviders);
    const session = useSelector((state: RootState) => state.sessions.sessions[sessionId]);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    // Selection popup state
    const [showOverlayBtn, setShowOverlayBtn] = useState(false);
    const [btnPosition, setBtnPosition] = useState({ top: 0, left: 0 });
    const [selectionHighlightRects, setSelectionHighlightRects] = useState<Array<{
        top: number;
        left: number;
        width: number;
        height: number;
    }>>([]);
    const [selectedText, setSelectedText] = useState('');
    const [selectedAnchorOccurrence, setSelectedAnchorOccurrence] = useState<number | null>(null);
    const [copiedSelection, setCopiedSelection] = useState(false);
    const [copiedTurn, setCopiedTurn] = useState(false);
    const [contextMenu, setContextMenu] = useState<
        { x: number; y: number; type: 'delete-turn' }
        | { x: number; y: number; type: 'add-note'; selectedText: string }
        | null
    >(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const copyResetTimerRef = useRef<number | null>(null);
    const selectionCopyResetTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        const closeOnScroll = () => {
            closeMenu();
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
        };
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, []);

    useEffect(() => () => {
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
        }
    }, []);

    const clearSelectionOverlay = () => {
        setShowOverlayBtn(false);
        setSelectionHighlightRects([]);
        setSelectedAnchorOccurrence(null);
        setCopiedSelection(false);
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
            selectionCopyResetTimerRef.current = null;
        }
    };

    const assistantTurnMarkdown = useMemo(() => {
        if (!session || message.role !== 'assistant') return null;
        const assistantIndex = typeof messageIndex === 'number'
            ? messageIndex
            : session.messages.findIndex((m) => m.id === message.id);
        if (assistantIndex < 0) return null;

        const question = findTurnQuestionContent(session.messages, assistantIndex);
        if (!question) return null;

        const answer = stripThinkBlocks(message.content);
        if (!answer) return null;

        const modelName = getModelDisplayName(message.modelId || session.modelId, customProviders);
        return buildTurnMarkdown({ question, answer, modelName });
    }, [customProviders, message.content, message.id, message.modelId, message.role, messageIndex, session]);

    const handleCopyTurnMarkdown = async () => {
        if (!assistantTurnMarkdown) return;
        const copied = await copyTextToClipboard(assistantTurnMarkdown);
        if (!copied) return;
        setCopiedTurn(true);
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
        copyResetTimerRef.current = window.setTimeout(() => {
            setCopiedTurn(false);
            copyResetTimerRef.current = null;
        }, 1500);
    };

    const handleRegenerate = () => {
        dispatch(regenerateMessage({
            sessionId,
            messageId: message.id,
        }));
    };

    const assistantToolbarActions = useMemo(() => {
        if (message.role !== 'assistant') return [];

        const actions: TurnToolbarAction[] = [];
        if (assistantTurnMarkdown) {
            actions.push({
                id: 'copy-turn-markdown',
                label: copiedTurn ? 'Copied' : 'Copy',
                icon: copiedTurn ? <Check size={14} /> : <Copy size={14} />,
                onClick: handleCopyTurnMarkdown,
                title: 'Copy question + answer as Markdown',
            });
        }

        actions.push({
            id: 'regenerate-turn',
            label: 'Regenerate',
            icon: <RotateCcw size={14} />,
            onClick: handleRegenerate,
            title: 'Regenerate this reply',
            disabled: session?.isLoading,
        });

        return actions;
    }, [assistantTurnMarkdown, copiedTurn, handleCopyTurnMarkdown, handleRegenerate, message.role, session?.isLoading]);

    const handleMouseUp = (e: React.MouseEvent) => {
        // Only allow sub-sessions on assistant messages
        if (message.role !== 'assistant') return;

        const target = e.target as HTMLElement;
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const selected = getTrimmedRangeText(range);
        const selectionDecision = {
            hasLocalSelection: !!selection && selected.length > 0,
            targetInsideAnnotation: !!target.closest('.annotation-highlight'),
            targetInsideFloatingOverlay: !!target.closest('.floating-overlay'),
            targetInsideSubSessionButton: !!target.closest('.floating-subsession-btn'),
        };
        if (shouldIgnoreSubSessionMouseUpStateReset(selectionDecision)) {
            return;
        }
        const shouldShowOverlay = shouldShowSubSessionOverlay({
            ...selectionDecision,
        });

        if (shouldShowOverlay && selection) {
            if (!range) {
                clearSelectionOverlay();
                return;
            }
            if (!contentRef.current?.contains(range.commonAncestorContainer)) {
                clearSelectionOverlay();
                return;
            }
            const rect = range.getBoundingClientRect();
            const highlightRects = buildSelectionHighlightRects(
                Array.from(range.getClientRects()).map((clientRect) => ({
                    top: clientRect.top,
                    left: clientRect.left,
                    width: clientRect.width,
                    height: clientRect.height,
                }))
            );

            setSelectedText(selected);
            setSelectedAnchorOccurrence(resolveSelectionAnchorOccurrence({
                root: contentRef.current,
                range,
                anchorText: selected,
            }));
            setCopiedSelection(false);
            setSelectionHighlightRects(highlightRects);
            setBtnPosition({
                top: rect.top - 36,
                left: rect.left + rect.width / 2,
            });
            setShowOverlayBtn(true);
        } else {
            clearSelectionOverlay();
        }
    };

    const handleCreateSubSession = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedText.trim()) return;
        if (!session) return;
        const messageListEl = contentRef.current?.closest('.message-list') as HTMLElement | null;
        const preservedScrollTop = messageListEl?.scrollTop;
        const subSessionId = `sub-${Date.now()}`;
        const anchor = selectedText.trim();
        const mainContextSnapshotMessages = session.messages.map((m) => ({
            ...m,
            annotations: m.annotations ? m.annotations.map((a) => ({ ...a })) : [],
        }));

        dispatch(spawnSession({
            id: subSessionId,
            parentId: message.id,
            anchorText: anchor,
            anchorMessageId: message.id,
            messages: [],
            modelId: subModelId,
            isLoading: false,
            contextMode: subSessionContextMode,
            mainContextSnapshotMessages,
        }));

        dispatch(addAnnotation({
            sessionId,
            messageId: message.id,
            annotation: {
                id: `anno-${Date.now()}`,
                subSessionId,
                anchorText: anchor,
                createdAt: Date.now(),
                ...(selectedAnchorOccurrence !== null ? { anchorOccurrence: selectedAnchorOccurrence } : {}),
            }
        }));

        clearSelectionOverlay();
        setExpandedSessionId(subSessionId);

        // Clear browser selection
        clearBrowserSelection(window.getSelection());

        if (messageListEl && typeof preservedScrollTop === 'number') {
            // Keep viewport stable when annotation markup and overlay mount cause reflow.
            requestAnimationFrame(() => {
                messageListEl.scrollTop = preservedScrollTop;
                requestAnimationFrame(() => {
                    messageListEl.scrollTop = preservedScrollTop;
                });
            });
        }
    };

    const handleCopySelection = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const text = selectedText.trim();
        if (!text) return;
        const copied = await copyTextToClipboard(text);
        if (!copied) return;
        setCopiedSelection(true);
        if (selectionCopyResetTimerRef.current !== null) {
            window.clearTimeout(selectionCopyResetTimerRef.current);
        }
        selectionCopyResetTimerRef.current = window.setTimeout(() => {
            clearSelectionOverlay();
            clearBrowserSelection(window.getSelection());
            selectionCopyResetTimerRef.current = null;
        }, getSelectionCopyDismissDelay('main-message'));
    };

    const handleOpenSession = (subSessionId: string) => {
        setExpandedSessionId(subSessionId);
    };

    const handleDeleteSubSession = (annotationId: string, subSessionId: string) => {
        dispatch(removeAnnotationAndSubSession({
            sessionId,
            messageId: message.id,
            annotationId,
            subSessionId,
        }));
        if (expandedSessionId === subSessionId) {
            setExpandedSessionId(null);
        }
    };

    const selectionFloatingActions = useMemo(() => createSelectionFloatingActions({
        onCreateSubSession: handleCreateSubSession,
        onCopySelection: handleCopySelection,
        copiedSelection,
    }), [copiedSelection, handleCreateSubSession, handleCopySelection]);

    const handleContextMenu = (e: React.MouseEvent) => {
        const isMainSession = session?.parentId === null;
        if (!isMainSession) return;

        const maxX = window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_MARGIN;
        const adjustedX = Math.max(CONTEXT_MENU_MARGIN, Math.min(e.clientX, maxX));

        if (message.role === 'user') {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: adjustedX, y: e.clientY, type: 'delete-turn' });
            return;
        }

        if (message.role === 'assistant') {
            const selection = window.getSelection();
            const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
            const text = getTrimmedRangeText(range);
            const hasLocalSelection = !!range
                && text.length > 0
                && !!contentRef.current?.contains(range.commonAncestorContainer);
            const excerpt = hasLocalSelection
                ? text
                : message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || message.content.trim();
            if (!excerpt) return;
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
                x: adjustedX,
                y: e.clientY,
                type: 'add-note',
                selectedText: excerpt,
            });
        }
    };

    const sanitizeFileName = (text: string) => {
        const base = text
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .trim()
            .slice(0, 64);
        return base || 'note';
    };

    const addToNote = (excerpt: string) => {
        if (!session) return;
        const index = typeof messageIndex === 'number'
            ? messageIndex
            : session.messages.findIndex((m) => m.id === message.id);
        const question = session.messages
            .slice(0, Math.max(index, 0))
            .reverse()
            .find((m) => m.role === 'user');
        if (!question) return;

        const title = question.content.replace(/\s+/g, ' ').trim().slice(0, 100) || 'Untitled question';
        const noteId = `note-${question.id}`;
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
    };

    return (
        <div
            className={`message-item ${message.role}`}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            ref={contentRef}
            data-message-id={message.id}
        >
            <div className="message-bubble">
                {session?.parentId === null && message.role === 'assistant' && message.modelId && (
                    <div className="assistant-model-badge">
                        {getModelDisplayName(message.modelId, customProviders)}
                    </div>
                )}
                <MessageContent
                    content={message.content}
                    annotations={message.annotations}
                    onOpenSession={handleOpenSession}
                    onDeleteSubSession={handleDeleteSubSession}
                    enableCodeBlockCopy={message.role === 'assistant'}
                    searchQuery={searchQuery}
                />
                {message.role === 'assistant' && (
                    <TurnToolbar
                        className="assistant-turn-toolbar"
                        actions={assistantToolbarActions}
                    />
                )}
            </div>

            {selectionHighlightRects.map((rect, index) => (
                <div
                    key={`${rect.top}-${rect.left}-${index}`}
                    className="floating-selection-highlight"
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    }}
                />
            ))}

            {/* ─── Selection popup ─── */}
            {showOverlayBtn && (
                <div
                    className="floating-subsession-btn"
                    style={{
                        position: 'fixed',
                        top: btnPosition.top,
                        left: btnPosition.left,
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
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

            {/* ─── Expanded overlay ─── */}
            {expandedSessionId && (
                <FloatingOverlay
                    sessionId={expandedSessionId}
                    onClose={() => setExpandedSessionId(null)}
                />
            )}

            {contextMenu && (
                <div
                    className="message-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'delete-turn' ? (
                        <button
                            className="danger-action"
                            type="button"
                            onClick={() => {
                                dispatch(removeTurn({ sessionId, messageId: message.id }));
                                setContextMenu(null);
                            }}
                        >
                            Delete
                        </button>
                    ) : (
                        <button
                            className="note-action"
                            type="button"
                            onClick={() => {
                                addToNote(contextMenu.selectedText);
                                setContextMenu(null);
                            }}
                        >
                            Add to note
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageItem;
