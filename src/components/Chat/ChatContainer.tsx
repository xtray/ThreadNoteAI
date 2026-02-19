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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

    const handleSend = () => {
        if (!inputText.trim() || !activeSessionId || session?.isLoading) return;

        dispatch({
            type: 'sessions/sendMessage',
            payload: { sessionId: activeSessionId, content: inputText }
        });
        setInputText('');
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
                            <li>Type a prompt and press Enter (or Send) to talk with the AI.</li>
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
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    disabled={session.isLoading}
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
