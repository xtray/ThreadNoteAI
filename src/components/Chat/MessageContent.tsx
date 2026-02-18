import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { MessageAnnotation } from '../../store/slices/sessionSlice';

interface MessageContentProps {
    content: string;
    annotations?: MessageAnnotation[];
    onOpenSession?: (sessionId: string) => void;
    onDeleteSubSession?: (annotationId: string, subSessionId: string) => void;
}

/**
 * Parses the AI response to separate <think>...</think> blocks
 * from the main content, then renders Markdown properly.
 * Renders persisted inline annotations by applying highlight overlays
 * on top of markdown text nodes after markdown render.
 */
const MessageContent: React.FC<MessageContentProps> = ({
    content,
    annotations,
    onOpenSession,
    onDeleteSubSession,
}) => {
    const [thinkExpanded, setThinkExpanded] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        annotationId: string;
        subSessionId: string;
    } | null>(null);
    const markdownRef = useRef<HTMLDivElement>(null);

    // Extract <think>...</think> block(s)
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const thinkMatches: string[] = [];
    let match;
    while ((match = thinkRegex.exec(content)) !== null) {
        thinkMatches.push(match[1].trim());
    }

    // Remove <think> blocks from the main content
    const mainContent = content.replace(thinkRegex, '').trim();

    const sortedAnnotations = useMemo(
        () => [...(annotations || [])].sort((a, b) => a.createdAt - b.createdAt),
        [annotations]
    );

    const removeInjectedHighlights = () => {
        const root = markdownRef.current;
        if (!root) return;
        const marks = root.querySelectorAll('.annotation-highlight[data-generated="true"]');
        marks.forEach((mark) => {
            const parent = mark.parentNode;
            if (!parent) return;
            while (mark.firstChild) {
                if (
                    mark.firstChild instanceof HTMLElement &&
                    mark.firstChild.classList.contains('annotation-bubble-icon')
                ) {
                    mark.removeChild(mark.firstChild);
                } else {
                    parent.insertBefore(mark.firstChild, mark);
                }
            }
            parent.removeChild(mark);
        });
    };

    const injectHighlight = (annotation: MessageAnnotation) => {
        const root = markdownRef.current;
        if (!root || !annotation.anchorText.trim()) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const text = node.textContent || '';
                if (!text.trim()) return NodeFilter.FILTER_SKIP;
                const parent = (node as Text).parentElement;
                if (!parent) return NodeFilter.FILTER_SKIP;
                if (parent.closest('.annotation-highlight')) return NodeFilter.FILTER_SKIP;
                return text.includes(annotation.anchorText)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP;
            },
        });

        const targetNode = walker.nextNode() as Text | null;
        if (!targetNode) return;

        const text = targetNode.textContent || '';
        const start = text.indexOf(annotation.anchorText);
        if (start < 0) return;

        const range = document.createRange();
        range.setStart(targetNode, start);
        range.setEnd(targetNode, start + annotation.anchorText.length);

        const span = document.createElement('span');
        span.className = 'annotation-highlight';
        span.setAttribute('data-generated', 'true');
        span.setAttribute('data-annotation-id', annotation.id);
        span.setAttribute('data-sub-session-id', annotation.subSessionId);
        span.setAttribute('title', 'Open sub-session');

        range.surroundContents(span);

        const bubble = document.createElement('span');
        bubble.className = 'annotation-bubble-icon';
        bubble.textContent = '···';
        span.appendChild(bubble);
    };

    useEffect(() => {
        removeInjectedHighlights();
        sortedAnnotations.forEach(injectHighlight);
    }, [mainContent, sortedAnnotations]);

    useEffect(() => {
        const closeContextMenu = () => setContextMenu(null);
        window.addEventListener('click', closeContextMenu);
        window.addEventListener('scroll', closeContextMenu, true);
        return () => {
            window.removeEventListener('click', closeContextMenu);
            window.removeEventListener('scroll', closeContextMenu, true);
        };
    }, []);

    const renderers = {
        a: ({ href, children, ...props }: any) => {
            if (href && href.startsWith('subsession:')) {
                const sessionId = href.split(':')[1];
                return (
                    <span className="annotation-highlight" data-sub-session-id={sessionId}>
                        {children}
                        <span className="annotation-bubble-icon">···</span>
                    </span>
                );
            }
            return <a href={href} {...props}>{children}</a>;
        }
    };

    const handleMarkdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const marker = target.closest('.annotation-highlight') as HTMLElement | null;
        if (!marker) return;
        const subSessionId = marker.getAttribute('data-sub-session-id');
        if (!subSessionId) return;
        e.preventDefault();
        e.stopPropagation();
        onOpenSession?.(subSessionId);
    };

    const handleMarkdownContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const marker = target.closest('.annotation-highlight') as HTMLElement | null;
        if (!marker) return;

        const annotationId = marker.getAttribute('data-annotation-id');
        const subSessionId = marker.getAttribute('data-sub-session-id');
        if (!annotationId || !subSessionId) return;

        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            annotationId,
            subSessionId,
        });
    };

    return (
        <div className="message-content">
            {/* Thinking section — collapsible */}
            {thinkMatches.length > 0 && (
                <div className="think-block">
                    <button
                        className="think-toggle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setThinkExpanded(!thinkExpanded);
                        }}
                    >
                        <Brain size={14} />
                        <span>Reasoning</span>
                        {thinkExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {thinkExpanded && (
                        <div className="think-content">
                            {thinkMatches.map((thinking, i) => (
                                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                                    {thinking}
                                </ReactMarkdown>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main response — rendered as Markdown */}
            {mainContent && (
                <div
                    className="markdown-body"
                    ref={markdownRef}
                    onClick={handleMarkdownClick}
                    onContextMenu={handleMarkdownContextMenu}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={renderers}
                    >
                        {mainContent}
                    </ReactMarkdown>
                </div>
            )}
            {contextMenu && (
                <div
                    className="annotation-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => {
                            const confirmed = window.confirm('Delete this sub-session and its nested sub-sessions?');
                            if (!confirmed) return;
                            onDeleteSubSession?.(contextMenu.annotationId, contextMenu.subSessionId);
                            setContextMenu(null);
                        }}
                    >
                        Delete Sub-session
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageContent;
