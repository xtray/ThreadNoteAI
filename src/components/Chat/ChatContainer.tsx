import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import MessageItem from './MessageItem';
import { createSession } from '../../store/slices/sessionSlice';
import { Send, Square } from 'lucide-react';

const ChatContainer: React.FC = () => {
    const dispatch = useDispatch();
    const activeSessionId = useSelector((state: RootState) => state.sessions.activeSessionId);
    const session = useSelector((state: RootState) =>
        activeSessionId ? state.sessions.sessions[activeSessionId] : null
    );
    const mainModelId = useSelector((state: RootState) => state.config.mainModelId);

    const [inputText, setInputText] = useState('');
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
                <div className="welcome-content">
                    <h2>👋 Welcome to WrapperAI</h2>
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
                <span className="model-badge">{session.modelId}</span>
                {session.isLoading && <span className="loading-indicator">Thinking...</span>}
            </div>
            <div className="message-list">
                {session.messages.map((m) => (
                    <MessageItem key={m.id} message={m} sessionId={session.id} />
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
