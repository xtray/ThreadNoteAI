import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { prepareMathMarkdown, remarkDisplayMath } from '../../utils/mathMarkdown';
import { ChevronDown, ChevronRight, Brain, Check, Copy } from 'lucide-react';
import { MessageAnnotation } from '../../store/slices/sessionSlice';
import { copyTextToClipboard } from './turnUtils';
import { normalizeSearchQuery } from '../../utils/sidebarSearch';
import { highlightReactNode, renderWithSearchHighlight } from '../../utils/searchHighlight';
import { findAnnotationTextMatch, getSegmentHighlightRanges, safelySurroundRangeContents } from './annotationHighlight';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const extractNodeText = (value: React.ReactNode): string => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(extractNodeText).join('');
    }
    if (React.isValidElement(value)) {
        return extractNodeText((value.props as { children?: React.ReactNode }).children);
    }
    return '';
};

interface MessageContentProps {
    content: string;
    annotations?: MessageAnnotation[];
    onOpenSession?: (sessionId: string) => void;
    onDeleteSubSession?: (annotationId: string, subSessionId: string) => void;
    onResponseContextMenu?: (e: React.MouseEvent<HTMLElement>, excerpt: string) => void;
    enableCodeBlockCopy?: boolean;
    searchQuery?: string;
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
    onResponseContextMenu,
    enableCodeBlockCopy = false,
    searchQuery = '',
}) => {
    const [thinkExpanded, setThinkExpanded] = useState(false);
    const [copiedCodeBlockId, setCopiedCodeBlockId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        annotationId: string;
        subSessionId: string;
    } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        annotationId: string;
        subSessionId: string;
    } | null>(null);
    const markdownRef = useRef<HTMLDivElement>(null);
    const copyResetTimerRef = useRef<number | null>(null);
    const normalizedSearchQuery = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);

    // Extract <think>...</think> block(s)
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const thinkMatches: string[] = [];
    let match;
    while ((match = thinkRegex.exec(content)) !== null) {
        thinkMatches.push(match[1]);
    }

    // Remove <think> blocks from the main content
    const mainContent = content.replace(thinkRegex, '');

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
        const anchorText = annotation.anchorText.trim();
        if (!root || !anchorText) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const text = node.textContent || '';
                if (!text.trim()) return NodeFilter.FILTER_SKIP;
                const parent = (node as Text).parentElement;
                if (!parent || parent.closest('.katex')) return NodeFilter.FILTER_SKIP;
                return NodeFilter.FILTER_ACCEPT;
            },
        });

        const segments: Array<{ node: Text; start: number; end: number }> = [];
        let fullText = '';
        let current: Node | null = walker.nextNode();
        while (current) {
            const textNode = current as Text;
            const text = textNode.textContent || '';
            const start = fullText.length;
            fullText += text;
            segments.push({ node: textNode, start, end: fullText.length });
            current = walker.nextNode();
        }
        if (segments.length === 0 || !fullText) return;

        const match = findAnnotationTextMatch(fullText, anchorText, annotation.anchorOccurrenceIndex);
        if (!match) return;
        const matchEnd = match.start + match.length;

        const highlightRanges = getSegmentHighlightRanges(segments, match.start, matchEnd);
        if (highlightRanges.length === 0) return;

        const highlightedSpans = highlightRanges.map((highlightRange) => {
            if (highlightRange.node.parentElement?.closest('.annotation-highlight')) return null;

            const range = document.createRange();
            range.setStart(highlightRange.node, highlightRange.startOffset);
            range.setEnd(highlightRange.node, highlightRange.endOffset);

            const span = document.createElement('span');
            span.className = 'annotation-highlight';
            span.setAttribute('data-generated', 'true');
            span.setAttribute('data-annotation-id', annotation.id);
            span.setAttribute('data-sub-session-id', annotation.subSessionId);
            span.setAttribute('title', 'Open sub-session');

            return safelySurroundRangeContents(range, span) ? span : null;
        }).filter((span): span is HTMLSpanElement => span !== null);

        const lastSpan = highlightedSpans[highlightedSpans.length - 1];
        if (!lastSpan) return;

        const bubble = document.createElement('span');
        bubble.className = 'annotation-bubble-icon';
        bubble.textContent = '···';
        lastSpan.appendChild(bubble);
    };

    // Annotation highlights are injected into the rendered markdown DOM, so they
    // must be re-applied after every React commit that can recreate that subtree.
    useIsomorphicLayoutEffect(() => {
        removeInjectedHighlights();
        sortedAnnotations.forEach(injectHighlight);
    });

    useEffect(() => {
        const closeContextMenu = () => setContextMenu(null);
        window.addEventListener('click', closeContextMenu);
        window.addEventListener('scroll', closeContextMenu, true);
        return () => {
            window.removeEventListener('click', closeContextMenu);
            window.removeEventListener('scroll', closeContextMenu, true);
        };
    }, []);

    useEffect(() => () => {
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
    }, []);

    const handleCopyCodeBlock = async (codeText: string, blockId: string) => {
        if (!codeText) return;
        const copied = await copyTextToClipboard(codeText);
        if (!copied) return;
        setCopiedCodeBlockId(blockId);
        if (copyResetTimerRef.current !== null) {
            window.clearTimeout(copyResetTimerRef.current);
        }
        copyResetTimerRef.current = window.setTimeout(() => {
            setCopiedCodeBlockId(null);
            copyResetTimerRef.current = null;
        }, 1500);
    };

    let codeBlockRenderCount = 0;
    const renderers = {
        p: ({ children, ...props }: any) => renderWithSearchHighlight('p', children, props, normalizedSearchQuery, 'message-p'),
        li: ({ children, ...props }: any) => renderWithSearchHighlight('li', children, props, normalizedSearchQuery, 'message-li'),
        h1: ({ children, ...props }: any) => renderWithSearchHighlight('h1', children, props, normalizedSearchQuery, 'message-h1'),
        h2: ({ children, ...props }: any) => renderWithSearchHighlight('h2', children, props, normalizedSearchQuery, 'message-h2'),
        h3: ({ children, ...props }: any) => renderWithSearchHighlight('h3', children, props, normalizedSearchQuery, 'message-h3'),
        h4: ({ children, ...props }: any) => renderWithSearchHighlight('h4', children, props, normalizedSearchQuery, 'message-h4'),
        h5: ({ children, ...props }: any) => renderWithSearchHighlight('h5', children, props, normalizedSearchQuery, 'message-h5'),
        h6: ({ children, ...props }: any) => renderWithSearchHighlight('h6', children, props, normalizedSearchQuery, 'message-h6'),
        blockquote: ({ children, ...props }: any) => renderWithSearchHighlight('blockquote', children, props, normalizedSearchQuery, 'message-blockquote'),
        strong: ({ children, ...props }: any) => renderWithSearchHighlight('strong', children, props, normalizedSearchQuery, 'message-strong'),
        em: ({ children, ...props }: any) => renderWithSearchHighlight('em', children, props, normalizedSearchQuery, 'message-em'),
        code: ({ children, className, ...props }: any) => renderWithSearchHighlight('code', children, { className, ...props }, normalizedSearchQuery, 'message-code'),
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
            return renderWithSearchHighlight('a', children, { href, ...props }, normalizedSearchQuery, 'message-link');
        },
        pre: ({ children, node, ...props }: any) => {
            if (!enableCodeBlockCopy) {
                return <pre {...props}>{highlightReactNode(children, normalizedSearchQuery, 'message-pre')}</pre>;
            }

            const codeText = extractNodeText(children).replace(/\n$/, '');
            const blockId = `code-block-${codeBlockRenderCount++}`;
            const copied = copiedCodeBlockId === blockId;

            return (
                <div className="code-block-wrapper">
                    <pre {...props}>{highlightReactNode(children, normalizedSearchQuery, 'message-pre')}</pre>
                    <button
                        type="button"
                        className="code-block-copy-btn"
                        title="Copy code block"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleCopyCodeBlock(codeText, blockId);
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.detail === 0) {
                                void handleCopyCodeBlock(codeText, blockId);
                            }
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            );
        },
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
        if (!marker) {
            if (!onResponseContextMenu) return;
            const selection = window.getSelection();
            const text = selection?.toString() || '';
            const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
            const hasLocalSelection = !!range
                && text.trim().length > 0
                && !!markdownRef.current?.contains(range.commonAncestorContainer);
            const excerpt = hasLocalSelection ? text.trim() : mainContent.trim();
            if (!excerpt) return;
            onResponseContextMenu(e, excerpt);
            return;
        }

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
                                <ReactMarkdown key={i} remarkPlugins={[remarkGfm, remarkMath, remarkDisplayMath]} rehypePlugins={[rehypeKatex]}>
                                    {prepareMathMarkdown(thinking)}
                                </ReactMarkdown>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main response — rendered as Markdown */}
            {mainContent.trim() && (
                <div
                    className="markdown-body"
                    ref={markdownRef}
                    onClick={handleMarkdownClick}
                    onContextMenu={handleMarkdownContextMenu}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath, remarkDisplayMath]} rehypePlugins={[rehypeKatex]}
                        components={renderers}
                    >
                        {prepareMathMarkdown(mainContent)}
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
                            setContextMenu(null);
                            setDeleteConfirm({
                                annotationId: contextMenu.annotationId,
                                subSessionId: contextMenu.subSessionId,
                            });
                        }}
                    >
                        Delete Sub-session
                    </button>
                </div>
            )}
            {deleteConfirm && (
                <div
                    className="confirm-modal-backdrop annotation-delete-backdrop"
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div className="confirm-modal annotation-delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete sub-session?</h3>
                        <p>This will remove this sub-session and all nested sub-sessions.</p>
                        <div className="confirm-modal-actions">
                            <button
                                className="confirm-cancel-btn"
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-danger-btn"
                                type="button"
                                onClick={() => {
                                    onDeleteSubSession?.(deleteConfirm.annotationId, deleteConfirm.subSessionId);
                                    setDeleteConfirm(null);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageContent;
