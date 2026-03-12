import { Message } from '../../store/slices/sessionSlice';

export const findTurnQuestionContent = (messages: Message[], assistantIndex: number): string | null => {
    if (assistantIndex < 0 || assistantIndex >= messages.length) return null;
    for (let i = assistantIndex - 1; i >= 0; i -= 1) {
        if (messages[i].role === 'user') {
            return messages[i].content.trim() || null;
        }
    }
    return null;
};

export const stripThinkBlocks = (content: string) =>
    content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

export const buildTurnMarkdown = (params: { question: string; answer: string; modelName?: string }) => {
    const answerTitle = params.modelName
        ? `## Answer (${params.modelName})`
        : '## Answer';
    return `## Question\n\n${params.question}\n\n${answerTitle}\n\n${params.answer}\n`;
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // fallback to legacy copy path
    }

    if (typeof document === 'undefined') return false;
    let textarea: HTMLTextAreaElement | null = null;
    let appended = false;
    try {
        textarea = document.createElement('textarea');
        const activeElement = typeof HTMLElement !== 'undefined' && document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        appended = true;
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const copied = document.execCommand('copy');
        activeElement?.focus?.();
        return copied;
    } catch {
        return false;
    } finally {
        if (textarea && appended && typeof document.body?.removeChild === 'function') {
            document.body.removeChild(textarea);
        }
    }
};
