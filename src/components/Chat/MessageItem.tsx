import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message, spawnSession, addAnnotation, removeAnnotationAndSubSession, removeTurn } from '../../store/slices/sessionSlice';
import { RootState } from '../../store';
import FloatingOverlay from './FloatingOverlay';
import MessageContent from './MessageContent';
import { setActiveNoteId, upsertNote } from '../../store/slices/notesSlice';

interface MessageItemProps {
    message: Message;
    sessionId: string;
    messageIndex?: number;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, sessionId, messageIndex }) => {
    const CONTEXT_MENU_WIDTH = 160;
    const CONTEXT_MENU_MARGIN = 10;
    const dispatch = useDispatch();
    const subModelId = useSelector((state: RootState) => state.config.subModelId);
    const session = useSelector((state: RootState) => state.sessions.sessions[sessionId]);
    const notes = useSelector((state: RootState) => state.notes.notes);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    // Selection popup state
    const [showOverlayBtn, setShowOverlayBtn] = useState(false);
    const [btnPosition, setBtnPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [contextMenu, setContextMenu] = useState<
        { x: number; y: number; type: 'delete-turn' }
        | { x: number; y: number; type: 'add-note'; selectedText: string }
        | null
    >(null);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, []);

    const handleMouseUp = (e: React.MouseEvent) => {
        // Only allow sub-sessions on assistant messages
        if (message.role !== 'assistant') return;

        // Don't trigger selection popup if clicking inside an annotation marker
        const target = e.target as HTMLElement;
        if (target.closest('.annotation-highlight') || target.closest('.floating-overlay')) return;

        const selection = window.getSelection();
        const selected = selection?.toString().trim() || '';
        if (selection && selected.length > 0) {
            const range = selection.getRangeAt(0);
            if (!contentRef.current?.contains(range.commonAncestorContainer)) {
                setShowOverlayBtn(false);
                return;
            }
            const rect = range.getBoundingClientRect();

            setSelectedText(selected);
            setBtnPosition({
                top: rect.top - 36,
                left: rect.left + rect.width / 2,
            });
            setShowOverlayBtn(true);
        } else {
            setShowOverlayBtn(false);
        }
    };

    const handleCreateSubSession = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedText.trim()) return;
        if (!session) return;
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
            contextMode: 'new',
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
            }
        }));

        setShowOverlayBtn(false);
        setExpandedSessionId(subSessionId);

        // Clear browser selection
        window.getSelection()?.removeAllRanges();
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
            const text = selection?.toString() || '';
            const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
            const hasLocalSelection = !!range
                && text.trim().length > 0
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
        window.getSelection()?.removeAllRanges();
    };

    return (
        <div
            className={`message-item ${message.role}`}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            ref={contentRef}
        >
            <div className="message-bubble">
                <MessageContent
                    content={message.content}
                    annotations={message.annotations}
                    onOpenSession={handleOpenSession}
                    onDeleteSubSession={handleDeleteSubSession}
                />
            </div>

            {/* ─── Selection popup ─── */}
            {showOverlayBtn && (
                <button
                    className="floating-subsession-btn"
                    style={{
                        position: 'fixed',
                        top: btnPosition.top,
                        left: btnPosition.left,
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                    }}
                    onClick={handleCreateSubSession}
                >
                    💬 Sub-session
                </button>
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
                                dispatch(removeTurn({ sessionId, userMessageId: message.id }));
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
