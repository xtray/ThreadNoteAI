import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import MessageItem from './MessageItem';
import {
    ChatSession,
    createSession,
    Message,
    MultiModelRound,
    MultiModelSessionState,
    setMultiModelActiveTab,
    setMultiModelPrimaryModel,
    setSessionMultiReplyEnabled,
    updateMessage,
    updateSessionModel,
} from '../../store/slices/sessionSlice';
import { Send, Square } from 'lucide-react';
import { getModelDisplayName, getProvisionedModelOptions } from '../../utils/modelDisplay';
import { normalizeSearchQuery } from '../../utils/sidebarSearch';
import { getAppText } from '../../i18n/text';

interface ChatContainerProps {
    searchQuery?: string;
}

const MAX_UI_MAIN_MODELS = 3;

const uniqueNonEmptyModelIds = (modelIds: string[]) => {
    const deduped = new Set<string>();
    modelIds.forEach((modelId) => {
        if (modelId) {
            deduped.add(modelId);
        }
    });
    return [...deduped];
};

const clampMainModelSlots = (value: number) =>
    Math.min(MAX_UI_MAIN_MODELS, Math.max(1, Math.trunc(value || 1)));

export const orderModelOptionsBySelection = <T extends { id: string }>(
    options: T[],
    selectedModelIds: string[],
) => {
    const selectedOptionIds = new Set(selectedModelIds);
    const optionMap = new Map(options.map((option) => [option.id, option]));
    const orderedSelectedOptions = uniqueNonEmptyModelIds(selectedModelIds)
        .map((modelId) => optionMap.get(modelId))
        .filter((option): option is T => !!option);
    const remainingOptions = options.filter((option) => !selectedOptionIds.has(option.id));
    return [...orderedSelectedOptions, ...remainingOptions];
};

export const resolveRoundTabModelId = (
    multiModel: MultiModelSessionState | undefined,
    round: MultiModelRound | null | undefined,
    roundId: string,
    fallbackModelId?: string | null,
) => {
    if (!round) return fallbackModelId || null;
    const roundTabModelId = multiModel?.roundActiveTabModelIds?.[roundId];
    if (roundTabModelId && round.modelOrder.includes(roundTabModelId)) {
        return roundTabModelId;
    }
    if (fallbackModelId && round.modelOrder.includes(fallbackModelId)) {
        return fallbackModelId;
    }
    return round.modelOrder[0] || null;
};

export const projectRootSessionMessagesByRoundTabs = (session: ChatSession | null): Message[] => {
    if (!session) return [];
    if (session.parentId !== null || !session.multiModel) {
        return session.messages;
    }

    return session.messages.map((message) => {
        if (message.role !== 'assistant' || !message.roundId) {
            return message;
        }

        const round = session.multiModel?.rounds[message.roundId];
        const activeModelId = resolveRoundTabModelId(session.multiModel, round, message.roundId, message.modelId);
        if (!round || !activeModelId) {
            return message;
        }

        const activeReply = round.modelReplies[activeModelId];
        if (!activeReply) {
            return { ...message, modelId: activeModelId };
        }

        return {
            ...message,
            content: activeReply.content,
            modelId: activeModelId,
        };
    });
};

export const shouldAutoScrollMessageList = (options: {
    previous: {
        sessionId: string;
        messageCount: number;
        lastMessageId: string | null;
        lastMessageContent: string;
        isLoading: boolean;
    } | null;
    next: {
        sessionId: string;
        messageCount: number;
        lastMessageId: string | null;
        lastMessageContent: string;
        isLoading: boolean;
    };
    hasSearchQuery: boolean;
}) => {
    if (options.hasSearchQuery) return false;

    const previous = options.previous;
    const next = options.next;
    const sessionChanged = !previous || previous.sessionId !== next.sessionId;
    const messageCountIncreased = !!previous && next.messageCount > previous.messageCount;
    const loadingMessageUpdated = !!previous
        && next.isLoading
        && previous.lastMessageId === next.lastMessageId
        && previous.lastMessageContent !== next.lastMessageContent;

    return sessionChanged || messageCountIncreased || loadingMessageUpdated;
};

const ChatContainer: React.FC<ChatContainerProps> = ({ searchQuery = '' }) => {
    const dispatch = useDispatch();
    const activeSessionId = useSelector((state: RootState) => state.sessions.activeSessionId);
    const session = useSelector((state: RootState) =>
        activeSessionId ? state.sessions.sessions[activeSessionId] : null
    );
    const mainModelId = useSelector((state: RootState) => state.config.mainModelId);
    const apiKeys = useSelector((state: RootState) => state.config.apiKeys);
    const maxConcurrentMainModels = useSelector((state: RootState) => state.config.maxConcurrentMainModels);
    const defaultMainModelIds = useSelector((state: RootState) => state.config.defaultMainModelIds);
    const customProviders = useSelector((state: RootState) => state.config.customProviders);
    const language = useSelector((state: RootState) => state.config.language);
    const text = getAppText(language);
    const modelOptions = getProvisionedModelOptions({ apiKeys, customProviders });
    const allModelOptions = useMemo(() => [...modelOptions.builtIn, ...modelOptions.custom], [modelOptions]);
    const maxSelectableMainModels = clampMainModelSlots(maxConcurrentMainModels);
    const isRootSession = session?.parentId === null;
    const isMultiReplyEnabled = !isRootSession || session?.multiReplyEnabled !== false;

    const [inputText, setInputText] = useState('');
    const [helpOpen, setHelpOpen] = useState(false);
    const [nextRoundModelIds, setNextRoundModelIds] = useState<string[]>([]);
    const [hasSelectionOverride, setHasSelectionOverride] = useState(false);
    const orderedMainModelOptions = useMemo(
        () => orderModelOptionsBySelection(allModelOptions, nextRoundModelIds),
        [allModelOptions, nextRoundModelIds]
    );
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const previousScrollStateRef = useRef<{
        sessionId: string;
        messageCount: number;
        lastMessageId: string | null;
        lastMessageContent: string;
        isLoading: boolean;
    } | null>(null);
    const normalizedSearchQuery = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);
    const displayedMessages = useMemo(() => {
        return projectRootSessionMessagesByRoundTabs(session);
    }, [session]);

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

        if (shouldAutoScrollMessageList({
            previous,
            next: nextState,
            hasSearchQuery: !!normalizedSearchQuery,
        })) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        previousScrollStateRef.current = nextState;
    }, [normalizedSearchQuery, session?.id, session?.isLoading, session?.messages]);

    useEffect(() => {
        if (!normalizedSearchQuery) return;

        const scrollToFirstMatch = () => {
            const firstMatch = messageListRef.current?.querySelector('.search-highlight[data-search-hit="true"]') as HTMLElement | null;
            if (!firstMatch) return;
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        const frame = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(scrollToFirstMatch);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [displayedMessages, normalizedSearchQuery, session?.id]);

    useEffect(() => {
        if (!session || session.parentId !== null) {
            setNextRoundModelIds([]);
            setHasSelectionOverride(false);
            return;
        }

        const preferredModelIds = session.multiModel?.lastUsedSelectedModelIds?.length
            ? session.multiModel.lastUsedSelectedModelIds
            : defaultMainModelIds;
        const primaryModelId = session.multiModel?.primaryModelId || session.modelId;
        const sourceModelIds = isMultiReplyEnabled ? preferredModelIds : [primaryModelId];
        const nextSelection = uniqueNonEmptyModelIds(sourceModelIds).slice(0, maxSelectableMainModels);
        setNextRoundModelIds(
            nextSelection.length > 0
                ? nextSelection
                : uniqueNonEmptyModelIds(defaultMainModelIds).slice(0, maxSelectableMainModels)
        );
        setHasSelectionOverride(false);
    }, [
        session?.id,
        session?.parentId,
        session?.multiModel?.lastUsedSelectedModelIds,
        session?.multiModel?.primaryModelId,
        session?.modelId,
        session?.multiReplyEnabled,
        defaultMainModelIds,
        maxSelectableMainModels,
        isMultiReplyEnabled,
    ]);

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
            payload: {
                sessionId: activeSessionId,
                content: inputText,
                selectedModelIds: isRootSession && isMultiReplyEnabled && hasSelectionOverride ? nextRoundModelIds : undefined,
            }
        });
        setHasSelectionOverride(false);
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

    const handleToggleNextModel = (modelId: string) => {
        if (!isRootSession || session?.isLoading || !isMultiReplyEnabled) return;

        const isSelected = nextRoundModelIds.includes(modelId);
        if (isSelected) {
            if (nextRoundModelIds.length <= 1) return;
            setNextRoundModelIds(nextRoundModelIds.filter((id) => id !== modelId));
            setHasSelectionOverride(true);
            return;
        }

        if (nextRoundModelIds.length >= maxSelectableMainModels) return;
        setNextRoundModelIds([...nextRoundModelIds, modelId]);
        setHasSelectionOverride(true);
    };

    const activeRound = useMemo(() => {
        if (!session || session.parentId !== null) return null;
        const activeRoundId = session.multiModel?.activeRoundId;
        if (!activeRoundId) return null;
        return session.multiModel?.rounds[activeRoundId] || null;
    }, [session]);

    const activeTabModelId = useMemo(() => {
        if (!session || !activeRound) return null;
        return resolveRoundTabModelId(
            session.multiModel,
            activeRound,
            activeRound.id,
            session.multiModel?.activeTabModelId || session.modelId
        );
    }, [activeRound, session]);

    const latestAssistantMessageId = useMemo(() => {
        if (!session) return null;
        for (let i = session.messages.length - 1; i >= 0; i -= 1) {
            if (session.messages[i].role === 'assistant') {
                return session.messages[i].id;
            }
        }
        return null;
    }, [session]);

    const handleTabSwitch = (modelId: string, roundId?: string) => {
        if (!session || session.parentId !== null) return;
        dispatch(setMultiModelActiveTab({
            sessionId: session.id,
            modelId,
            roundId,
        }));
    };

    const handleSetPrimary = () => {
        if (!session || session.parentId !== null || !activeRound || !activeTabModelId) return;

        dispatch(setMultiModelPrimaryModel({
            sessionId: session.id,
            modelId: activeTabModelId,
        }));

        if (!latestAssistantMessageId) return;
        const activeReply = activeRound.modelReplies[activeTabModelId];
        dispatch(updateMessage({
            sessionId: session.id,
            messageId: latestAssistantMessageId,
            content: activeReply?.content ?? '',
            modelId: activeTabModelId,
        }));
    };

    const handleToggleMultiReply = () => {
        if (!session || session.parentId !== null) return;
        dispatch(setSessionMultiReplyEnabled({
            sessionId: session.id,
            enabled: !isMultiReplyEnabled,
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
                    {text.help}
                </button>
                {helpOpen && (
                    <div className="welcome-help-panel" id="welcome-help-panel" role="dialog" aria-label={text.basicGuide}>
                        <button
                            className="welcome-help-close"
                            onClick={() => setHelpOpen(false)}
                            aria-label={text.closeHelp}
                        >
                            ×
                        </button>
                        <h3>{text.basicOperations}</h3>
                        <ul>
                            {text.basicOperationItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="welcome-content">
                    <h2>{`👋 ${text.welcomeTitle}`}</h2>
                    <p>{text.welcomeHint}</p>
                    <button className="start-chat-btn" onClick={handleNewChat}>
                        {text.startNewChat}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-content">
            <div className="chat-header">
                {isRootSession ? (
                    <div className="main-model-picker">
                        <div className="main-model-chip-row">
                            {orderedMainModelOptions.map((model) => {
                                const selected = nextRoundModelIds.includes(model.id);
                                const reachedLimit = !selected && nextRoundModelIds.length >= maxSelectableMainModels;
                                return (
                                    <button
                                        key={model.id}
                                        className={`main-model-chip${selected ? ' is-selected' : ''}`}
                                        type="button"
                                        onClick={() => handleToggleNextModel(model.id)}
                                        disabled={session.isLoading || reachedLimit || !isMultiReplyEnabled}
                                        title={model.displayName}
                                    >
                                        {model.displayName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <select
                        className="chat-model-select"
                        value={session.modelId}
                        onChange={(e) =>
                            dispatch(updateSessionModel({ sessionId: session.id, modelId: e.target.value }))
                        }
                        disabled={session.isLoading}
                        title={getModelDisplayName(session.modelId, customProviders)}
                    >
                        <optgroup label={text.builtIn}>
                            {modelOptions.builtIn.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.displayName}
                                </option>
                            ))}
                        </optgroup>
                        {modelOptions.custom.length > 0 && (
                            <optgroup label={text.custom}>
                                {modelOptions.custom.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.displayName}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                )}
                {session.isLoading && <span className="loading-indicator">{text.thinking}</span>}
            </div>
            {isRootSession && activeRound && (
                <div className="multi-round-strip">
                    <div className="multi-round-tabs">
                        {activeRound.modelOrder.map((modelId) => {
                            const modelReply = activeRound.modelReplies[modelId];
                            const status = modelReply?.status || 'idle';
                            const isActive = activeTabModelId === modelId;
                            const isPrimary = session.multiModel?.primaryModelId === modelId;
                            return (
                                <button
                                    key={modelId}
                                    className={`multi-round-tab${isActive ? ' is-active' : ''}`}
                                    type="button"
                                    onClick={() => handleTabSwitch(modelId, activeRound.id)}
                                >
                                    <span className={`reply-status-dot is-${status}`} />
                                    <span>{getModelDisplayName(modelId, customProviders)}</span>
                                    {isPrimary && <span className="primary-pill">{text.primary}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="multi-round-actions">
                        <button
                            type="button"
                            className="set-primary-btn"
                            onClick={handleSetPrimary}
                            disabled={!activeTabModelId || session.multiModel?.primaryModelId === activeTabModelId}
                        >
                            {text.setAsPrimary}
                        </button>
                        <button
                            type="button"
                            className={`multi-reply-toggle${isMultiReplyEnabled ? ' is-on' : ''}`}
                            onClick={handleToggleMultiReply}
                            title={isMultiReplyEnabled ? text.multiReplyEnabledTitle : text.primaryOnlyRepliesTitle}
                        >
                            <span className="toggle-pill-label">{text.multiReply}</span>
                            <span className="toggle-pill-state">{isMultiReplyEnabled ? text.on : text.off}</span>
                        </button>
                    </div>
                </div>
            )}
            <div className="message-list" ref={messageListRef}>
                {displayedMessages.map((m, index) => {
                    const roundId = isRootSession ? m.roundId : undefined;
                    const messageRound = roundId ? session.multiModel?.rounds[roundId] : undefined;
                    const messageTabModelId = roundId
                        ? resolveRoundTabModelId(session.multiModel, messageRound, roundId, m.modelId)
                        : null;
                    const showPerMessageTabs = !!(
                        messageRound
                        && roundId
                        && m.role === 'assistant'
                        && messageRound.modelOrder.length > 1
                        && messageTabModelId
                    );

                    return (
                        <React.Fragment key={m.id}>
                            {showPerMessageTabs && (
                                <div className="message-round-tabs-row">
                                    {messageRound.modelOrder.map((modelId) => {
                                        const modelReply = messageRound.modelReplies[modelId];
                                        const status = modelReply?.status || 'idle';
                                        const isActive = messageTabModelId === modelId;
                                        const isPrimary = session.multiModel?.primaryModelId === modelId;
                                        return (
                                            <button
                                                key={`${m.id}-${modelId}`}
                                                className={`message-round-tab${isActive ? ' is-active' : ''}`}
                                                type="button"
                                                onClick={() => handleTabSwitch(modelId, roundId)}
                                            >
                                                <span className={`reply-status-dot is-${status}`} />
                                                <span>{getModelDisplayName(modelId, customProviders)}</span>
                                                {isPrimary && <span className="primary-pill">{text.primary}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <MessageItem
                                message={m}
                                sessionId={session.id}
                                messageIndex={index}
                                searchQuery={normalizedSearchQuery}
                            />
                        </React.Fragment>
                    );
                })}
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
                    placeholder={text.mainChatPlaceholder}
                    disabled={session.isLoading}
                    rows={1}
                />
                <button
                    className={session.isLoading ? 'send-action-btn is-stop' : 'send-action-btn'}
                    onClick={session.isLoading ? handleStop : handleSend}
                    disabled={!session.isLoading && !inputText.trim()}
                    title={session.isLoading ? text.stop : text.send}
                >
                    {session.isLoading ? (
                        <>
                            <Square size={14} />
                            <span>{text.stop}</span>
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
