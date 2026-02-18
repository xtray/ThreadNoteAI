import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Message, spawnSession, addAnnotation, removeAnnotationAndSubSession } from '../../store/slices/sessionSlice';
import { RootState } from '../../store';
import FloatingOverlay from './FloatingOverlay';
import MessageContent from './MessageContent';

interface MessageItemProps {
    message: Message;
    sessionId: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, sessionId }) => {
    const dispatch = useDispatch();
    const subModelId = useSelector((state: RootState) => state.config.subModelId);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    // Selection popup state
    const [showOverlayBtn, setShowOverlayBtn] = useState(false);
    const [btnPosition, setBtnPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');

    const contentRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = (e: React.MouseEvent) => {
        // Only allow sub-sessions on assistant messages
        if (message.role !== 'assistant') return;

        // Don't trigger selection popup if clicking inside an annotation marker
        const target = e.target as HTMLElement;
        if (target.closest('.annotation-highlight') || target.closest('.floating-overlay')) return;

        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            if (!contentRef.current?.contains(range.commonAncestorContainer)) {
                setShowOverlayBtn(false);
                return;
            }
            const rect = range.getBoundingClientRect();

            setSelectedText(selection.toString());
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
        const subSessionId = `sub-${Date.now()}`;
        const anchor = selectedText;

        dispatch(spawnSession({
            id: subSessionId,
            parentId: message.id,
            anchorText: anchor,
            anchorMessageId: message.id,
            messages: [],
            modelId: subModelId,
            isLoading: false,
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

    return (
        <div
            className={`message-item ${message.role}`}
            onMouseUp={handleMouseUp}
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
        </div>
    );
};

export default MessageItem;
