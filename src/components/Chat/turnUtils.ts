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
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
};
