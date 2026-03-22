import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, upsertNote } from '../../store/slices/notesSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { Components } from 'react-markdown';
import { buildNoteSearchTarget, buildSearchHighlightSegments, normalizeSearchQuery } from '../../utils/sidebarSearch';
import { highlightReactNode, renderWithSearchHighlight } from '../../utils/searchHighlight';
import { RootState } from '../../store';
import { getAppText } from '../../i18n/text';

interface NotebookViewerProps {
    note: Note | null;
    searchQuery?: string;
}

const splitMarkdownBlocks = (content: string): string[] => {
    if (!content) return [''];
    const lines = content.split('\n');
    const blocks: string[] = [];
    let current: string[] = [];
    let fenceChar: '`' | '~' | null = null;
    let fenceLen = 0;

    const flushCurrent = () => {
        if (current.length === 0) return;
        blocks.push(current.join('\n'));
        current = [];
    };

    for (const line of lines) {
        const isBlank = line.trim().length === 0;
        const parsedFence = parseFenceToken(line);

        if (!fenceChar && isBlank) {
            flushCurrent();
            continue;
        }

        current.push(line);

        if (parsedFence) {
            if (!fenceChar) {
                fenceChar = parsedFence.char;
                fenceLen = parsedFence.len;
            } else if (parsedFence.char === fenceChar && parsedFence.len >= fenceLen) {
                fenceChar = null;
                fenceLen = 0;
            }
        }
    }

    flushCurrent();
    return blocks.length > 0 ? blocks : [''];
};

const joinMarkdownBlocks = (blocks: string[]): string =>
    blocks.join('\n\n');

const isRawMarkdownDemoBlock = (block: string): boolean => {
    const trimmed = block.trim();
    if (!trimmed.startsWith('```markdown')) return false;
    return trimmed.endsWith('```');
};

const parseFenceToken = (line: string): { char: '`' | '~'; len: number } | null => {
    const trimmed = line.trimStart();
    const marker = trimmed.match(/^(`{3,}|~{3,})/);
    if (!marker) return null;
    const token = marker[1];
    return {
        char: token[0] as '`' | '~',
        len: token.length,
    };
};

const toggleTaskStateAtIndex = (block: string, taskIndex: number): string => {
    const lines = block.split('\n');
    let seen = 0;
    let fenceChar: '`' | '~' | null = null;
    let fenceLen = 0;

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const parsedFence = parseFenceToken(line);

        if (parsedFence) {
            if (!fenceChar) {
                fenceChar = parsedFence.char;
                fenceLen = parsedFence.len;
            } else if (parsedFence.char === fenceChar && parsedFence.len >= fenceLen) {
                fenceChar = null;
                fenceLen = 0;
            }
        }
        if (fenceChar) continue;

        const bulletMatch = line.match(/^(\s*[-*+]\s+\[)( |x|X)(\]\s.*)$/);
        if (bulletMatch) {
            if (seen === taskIndex) {
                const next = bulletMatch[2].toLowerCase() === 'x' ? ' ' : 'x';
                lines[i] = `${bulletMatch[1]}${next}${bulletMatch[3]}`;
                return lines.join('\n');
            }
            seen += 1;
            continue;
        }

        const orderedMatch = line.match(/^(\s*\d+\.\s+\[)( |x|X)(\]\s.*)$/);
        if (orderedMatch) {
            if (seen === taskIndex) {
                const next = orderedMatch[2].toLowerCase() === 'x' ? ' ' : 'x';
                lines[i] = `${orderedMatch[1]}${next}${orderedMatch[3]}`;
                return lines.join('\n');
            }
            seen += 1;
        }
    }

    return block;
};

const NotebookViewer: React.FC<NotebookViewerProps> = ({ note, searchQuery = '' }) => {
    const dispatch = useDispatch();
    const language = useSelector((state: RootState) => state.config.language);
    const text = getAppText(language);
    const [blocks, setBlocks] = useState<string[]>(['']);
    const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
    const editorShellRef = useRef<HTMLDivElement>(null);
    const blockListRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const draft = useMemo(() => joinMarkdownBlocks(blocks), [blocks]);
    const normalizedSearchQuery = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);
    const searchTarget = useMemo(
        () => (note ? buildNoteSearchTarget(note, normalizedSearchQuery) : null),
        [note, normalizedSearchQuery]
    );
    const titleSegments = useMemo(
        () => buildSearchHighlightSegments(note?.title || '', normalizedSearchQuery),
        [note?.title, normalizedSearchQuery]
    );

    const resizeTextarea = React.useCallback((el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.max(36, el.scrollHeight)}px`;
    }, []);

    useEffect(() => {
        setBlocks(splitMarkdownBlocks(note?.content || ''));
        setActiveBlockIndex(null);
    }, [note?.id, note?.content]);

    useEffect(() => {
        if (activeBlockIndex === null) return;
        resizeTextarea(textareaRefs.current[activeBlockIndex]);
    }, [activeBlockIndex, blocks, resizeTextarea]);

    useEffect(() => {
        if (!note) return;
        if (draft === note.content) return;
        const timer = window.setTimeout(() => {
            dispatch(
                upsertNote({
                    ...note,
                    content: draft,
                    updatedAt: Date.now(),
                })
            );
        }, 220);
        return () => window.clearTimeout(timer);
    }, [dispatch, note, draft]);

    const persistNow = React.useCallback(() => {
        if (!note) return;
        if (draft === note.content) return;
        dispatch(
            upsertNote({
                ...note,
                content: draft,
                updatedAt: Date.now(),
            })
        );
    }, [dispatch, note, draft]);

    const activateBlock = React.useCallback((index: number) => {
        if (!note) return;
        setActiveBlockIndex(index);
        window.requestAnimationFrame(() => {
            const el = textareaRefs.current[index];
            if (!el) return;
            resizeTextarea(el);
            el.focus();
            const pos = el.value.length;
            el.setSelectionRange(pos, pos);
        });
    }, [note, resizeTextarea]);

    const updateBlock = React.useCallback((index: number, value: string) => {
        setBlocks((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const toggleTaskInBlock = React.useCallback((blockIndex: number, taskIndex: number) => {
        setBlocks((prev) => {
            if (!prev[blockIndex]) return prev;
            const next = [...prev];
            next[blockIndex] = toggleTaskStateAtIndex(next[blockIndex], taskIndex);
            return next;
        });
    }, []);

    const leaveEditing = React.useCallback(() => {
        persistNow();
        setActiveBlockIndex(null);
    }, [persistNow]);

    useEffect(() => {
        if (!normalizedSearchQuery) return;

        const frame = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                if (searchTarget?.section === 'title') {
                    titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                const firstMatch = blockListRef.current?.querySelector('.search-highlight[data-search-hit="true"]') as HTMLElement | null;
                firstMatch?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [normalizedSearchQuery, note?.id, searchTarget, blocks]);

    if (!note) {
        return (
            <div className="notebook-empty">
                <h3>{text.noNoteSelected}</h3>
                <p>{text.notebookEmptyHint}</p>
            </div>
        );
    }

    return (
        <div className="notebook-viewer">
            <div className="notebook-header">
                <h2 ref={titleRef}>
                    {titleSegments.map((segment, index) => (
                        <span
                            key={`${note.id}-title-${index}`}
                            className={segment.matched ? 'search-highlight search-highlight-inline' : undefined}
                            data-search-hit={segment.matched ? 'true' : undefined}
                        >
                            {segment.text}
                        </span>
                    ))}
                </h2>
                <span>{new Date(note.updatedAt).toLocaleString()}</span>
            </div>

            <div className="notebook-editor-shell" ref={editorShellRef}>
                <div className="notebook-block-list" ref={blockListRef}>
                    {blocks.map((block, index) => {
                        const isActive = activeBlockIndex === index;
                        let taskIndexCounter = 0;
                        const renderers: Components = {
                            p: ({ children, ...props }: any) => renderWithSearchHighlight('p', children, props, normalizedSearchQuery, `note-p-${index}`),
                            li: ({ children, ...props }: any) => renderWithSearchHighlight('li', children, props, normalizedSearchQuery, `note-li-${index}`),
                            h1: ({ children, ...props }: any) => renderWithSearchHighlight('h1', children, props, normalizedSearchQuery, `note-h1-${index}`),
                            h2: ({ children, ...props }: any) => renderWithSearchHighlight('h2', children, props, normalizedSearchQuery, `note-h2-${index}`),
                            h3: ({ children, ...props }: any) => renderWithSearchHighlight('h3', children, props, normalizedSearchQuery, `note-h3-${index}`),
                            h4: ({ children, ...props }: any) => renderWithSearchHighlight('h4', children, props, normalizedSearchQuery, `note-h4-${index}`),
                            h5: ({ children, ...props }: any) => renderWithSearchHighlight('h5', children, props, normalizedSearchQuery, `note-h5-${index}`),
                            h6: ({ children, ...props }: any) => renderWithSearchHighlight('h6', children, props, normalizedSearchQuery, `note-h6-${index}`),
                            blockquote: ({ children, ...props }: any) => renderWithSearchHighlight('blockquote', children, props, normalizedSearchQuery, `note-blockquote-${index}`),
                            strong: ({ children, ...props }: any) => renderWithSearchHighlight('strong', children, props, normalizedSearchQuery, `note-strong-${index}`),
                            em: ({ children, ...props }: any) => renderWithSearchHighlight('em', children, props, normalizedSearchQuery, `note-em-${index}`),
                            code: ({ children, className, ...props }: any) => renderWithSearchHighlight('code', children, { className, ...props }, normalizedSearchQuery, `note-code-${index}`),
                            input: ({ type, checked, ...props }: any) => {
                                if (type !== 'checkbox') return <input type={type} checked={checked} {...props} />;
                                const currentTaskIndex = taskIndexCounter;
                                taskIndexCounter += 1;
                                return (
                                    <input
                                        type="checkbox"
                                        checked={!!checked}
                                        readOnly
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleTaskInBlock(index, currentTaskIndex);
                                        }}
                                    />
                                );
                            },
                        };
                        return (
                            <div
                                key={`${note.id}-${index}`}
                                className={`notebook-block ${isActive ? 'is-active' : ''}`}
                            >
                                {isActive ? (
                                    <textarea
                                        ref={(el) => {
                                            textareaRefs.current[index] = el;
                                        }}
                                        className="notebook-edit-input notebook-block-input"
                                        value={block}
                                        onChange={(e) => updateBlock(index, e.target.value)}
                                        onInput={(e) => resizeTextarea(e.currentTarget)}
                                        onBlur={(e) => {
                                            const nextFocused = e.relatedTarget as Node | null;
                                            if (!nextFocused || !editorShellRef.current?.contains(nextFocused)) {
                                                leaveEditing();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
                                                e.preventDefault();
                                                leaveEditing();
                                            }
                                        }}
                                        spellCheck={false}
                                        placeholder={text.writeMarkdownPlaceholder}
                                    />
                                ) : (
                                    <div
                                        className="notebook-render-view markdown-body"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            activateBlock(index);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                activateBlock(index);
                                            }
                                        }}
                                    >
                                        {isRawMarkdownDemoBlock(block) ? (
                                            <pre>
                                                <code>{block}</code>
                                            </pre>
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                                                {block || ' '}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default NotebookViewer;
