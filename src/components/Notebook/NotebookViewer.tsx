import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, upsertNote } from '../../store/slices/notesSlice';
import { useDispatch } from 'react-redux';

interface NotebookViewerProps {
    note: Note | null;
}

const NotebookViewer: React.FC<NotebookViewerProps> = ({ note }) => {
    const dispatch = useDispatch();
    const [draft, setDraft] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setDraft(note?.content || '');
        setIsEditing(false);
    }, [note?.id, note?.content]);

    useEffect(() => {
        if (!note || !isEditing) return;
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
    }, [dispatch, note, draft, isEditing]);

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

    const enterEditing = React.useCallback(() => {
        if (!note) return;
        setIsEditing(true);
        window.requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (!el) return;
            el.focus();
            const pos = el.value.length;
            el.setSelectionRange(pos, pos);
        });
    }, [note]);

    const leaveEditing = React.useCallback(() => {
        persistNow();
        setIsEditing(false);
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

            <div className="notebook-editor-shell">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="notebook-edit-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={leaveEditing}
                        spellCheck={false}
                        placeholder="Write Markdown..."
                    />
                ) : (
                    <div
                        className="notebook-render-view markdown-body"
                        onClick={enterEditing}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                enterEditing();
                            }
                        }}
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {draft || ' '}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookViewer;
