import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import MessageItem from './MessageItem';
import { createSession, updateSessionModel } from '../../store/slices/sessionSlice';
import { Send, Square } from 'lucide-react';
import { getModelDisplayName, getModelOptions } from '../../utils/modelDisplay';

const ChatContainer: React.FC = () => {
    const dispatch = useDispatch();
    const activeSessionId = useSelector((state: RootState) => state.sessions.activeSessionId);
    const session = useSelector((state: RootState) =>
        activeSessionId ? state.sessions.sessions[activeSessionId] : null
    );
    const mainModelId = useSelector((state: RootState) => state.config.mainModelId);
    const customProviders = useSelector((state: RootState) => state.config.customProviders);
    const modelOptions = getModelOptions(customProviders);

    const [inputText, setInputText] = useState('');
    const [helpOpen, setHelpOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const previousScrollStateRef = useRef<{
        sessionId: string;
        messageCount: number;
        lastMessageId: string | null;
        lastMessageContent: string;
        isLoading: boolean;
    } | null>(null);

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
        const sessionChanged = !previous || previous.sessionId !== nextState.sessionId;
        const messageCountIncreased = !!previous && nextState.messageCount > previous.messageCount;
        const loadingStarted = !!previous && !previous.isLoading && nextState.isLoading;
        const loadingMessageUpdated = !!previous
            && nextState.isLoading
            && previous.lastMessageId === nextState.lastMessageId
            && previous.lastMessageContent !== nextState.lastMessageContent;

        if (sessionChanged || messageCountIncreased || loadingStarted || loadingMessageUpdated) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        previousScrollStateRef.current = nextState;
    }, [session?.id, session?.isLoading, session?.messages]);

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [inputText]);

    const handleSend = () => {
        if (!inputText.trim() || !activeSessionId || session?.isLoading) return;

        dispatch({
            type: 'sessions/sendMessage',
            payload: { sessionId: activeSessionId, content: inputText }
        });
        setInputText('');
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

    const handleStop = () => {
        if (!activeSessionId) return;
        dispatch({
            type: 'sessions/stopGenerating',
            payload: { sessionId: activeSessionId },
        });
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

    if (!session) {
        return (
            <div className="chat-welcome">
                <button
                    className="welcome-help-btn"
                    onClick={() => setHelpOpen((prev) => !prev)}
                    aria-expanded={helpOpen}
                    aria-controls="welcome-help-panel"
                >
                    Help
                </button>
                {helpOpen && (
                    <div className="welcome-help-panel" id="welcome-help-panel" role="dialog" aria-label="Basic guide">
                        <button
                            className="welcome-help-close"
                            onClick={() => setHelpOpen(false)}
                            aria-label="Close help"
                        >
                            ×
                        </button>
                        <h3>Basic Operations</h3>
                        <ul>
                            <li>Click Start New Chat to create a new conversation.</li>
                            <li>Press Enter to send, Shift+Enter or Ctrl+J to insert a new line.</li>
                            <li>Select text in an AI reply to create a nested sub-session.</li>
                            <li>Use right-click actions to save reply snippets into Notebook.</li>
                            <li>Switch to Notebook mode from the left panel to edit notes.</li>
                        </ul>
                    </div>
                )}
                <div className="welcome-content">
                    <h2>👋 Welcome to ThreadNote AI</h2>
                    <p>Select a word in any AI response to create a nested sub-session.</p>
                    <button className="start-chat-btn" onClick={handleNewChat}>
                        Start New Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-content">
            <div className="chat-header">
                <select
                    className="chat-model-select"
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
                {session.isLoading && <span className="loading-indicator">Thinking...</span>}
            </div>
            <div className="message-list">
                {session.messages.map((m, index) => (
                    <MessageItem key={m.id} message={m} sessionId={session.id} messageIndex={index} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
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
                    placeholder="Type a message..."
                    disabled={session.isLoading}
                    rows={1}
                />
                <button
                    className={session.isLoading ? 'send-action-btn is-stop' : 'send-action-btn'}
                    onClick={session.isLoading ? handleStop : handleSend}
                    disabled={!session.isLoading && !inputText.trim()}
                    title={session.isLoading ? 'Stop generating' : 'Send'}
                >
                    {session.isLoading ? (
                        <>
                            <Square size={14} />
                            <span>Stop</span>
                        </>
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatContainer;
