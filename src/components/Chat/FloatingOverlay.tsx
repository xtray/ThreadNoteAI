import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { X, Send, Square, Maximize2, Minimize2 } from 'lucide-react';
import MessageContent from './MessageContent';

interface FloatingOverlayProps {
    sessionId: string;
    onClose: () => void;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 250;

const FloatingOverlay: React.FC<FloatingOverlayProps> = ({ sessionId, onClose }) => {
    const dispatch = useDispatch();
    const session = useSelector((state: RootState) => state.sessions.sessions[sessionId]);
    const [inputText, setInputText] = useState('');
    const [pendingSentText, setPendingSentText] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [size, setSize] = useState({ width: 380, height: 500 });
    const [isResizing, setIsResizing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

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

            <div className="overlay-model-badge">{session.modelId}</div>

            <div className="overlay-messages">
                {session.messages.map((m) => (
                    <div key={m.id} className={`overlay-message ${m.role}`}>
                        <MessageContent content={m.content} annotations={m.annotations} />
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
        </div>
    );
};

export default FloatingOverlay;
