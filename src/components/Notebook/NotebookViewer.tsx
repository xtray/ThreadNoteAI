import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, upsertNote } from '../../store/slices/notesSlice';
import { useDispatch } from 'react-redux';
import type { Components } from 'react-markdown';

interface NotebookViewerProps {
    note: Note | null;
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

const NotebookViewer: React.FC<NotebookViewerProps> = ({ note }) => {
    const dispatch = useDispatch();
    const [blocks, setBlocks] = useState<string[]>(['']);
    const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
    const editorShellRef = useRef<HTMLDivElement>(null);
    const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const draft = useMemo(() => joinMarkdownBlocks(blocks), [blocks]);

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

    if (!note) {
        return (
            <div className="notebook-empty">
                <h3>No note selected</h3>
                <p>Right click an AI response selection and choose "Add to note" to create your first note.</p>
            </div>
        );
    }

    return (
        <div className="notebook-viewer">
            <div className="notebook-header">
                <h2>{note.title}</h2>
                <span>{new Date(note.updatedAt).toLocaleString()}</span>
            </div>

            <div className="notebook-editor-shell" ref={editorShellRef}>
                <div className="notebook-block-list">
                    {blocks.map((block, index) => {
                        const isActive = activeBlockIndex === index;
                        let taskIndexCounter = 0;
                        const renderers: Components = {
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
                                        placeholder="Write Markdown..."
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
