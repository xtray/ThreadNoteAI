import { afterEach, describe, expect, it, vi } from 'vitest';
import { Message } from '../../store/slices/sessionSlice';
import { buildTurnMarkdown, copyTextToClipboard, findTurnQuestionContent, stripThinkBlocks } from './turnUtils';

const buildMessages = (): Message[] => ([
    { id: 'u1', role: 'user', content: 'What is RAG?', timestamp: 1 },
    { id: 'a1', role: 'assistant', content: 'RAG is ...', timestamp: 2 },
    { id: 'u2', role: 'user', content: 'Give me examples', timestamp: 3 },
    { id: 'a2', role: 'assistant', content: '<think>hidden</think>\nSure, here are examples.', timestamp: 4 },
]);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('turnUtils', () => {
    it('finds the nearest previous user question for an assistant reply', () => {
        const question = findTurnQuestionContent(buildMessages(), 3);
        expect(question).toBe('Give me examples');
    });

    it('returns null when assistant reply has no previous user message', () => {
        const messages: Message[] = [
            { id: 'a-only', role: 'assistant', content: 'hello', timestamp: 1 },
        ];
        expect(findTurnQuestionContent(messages, 0)).toBeNull();
    });

    it('strips think blocks from copied answer', () => {
        const clean = stripThinkBlocks('<think>hidden reasoning</think>\nVisible answer');
        expect(clean).toBe('Visible answer');
    });

    it('builds markdown with question and model-tagged answer', () => {
        const markdown = buildTurnMarkdown({
            question: 'What is RAG?',
            answer: 'RAG is retrieval augmented generation.',
            modelName: 'GPT-4o',
        });
        expect(markdown).toBe(
            '## Question\n\nWhat is RAG?\n\n## Answer (GPT-4o)\n\nRAG is retrieval augmented generation.\n'
        );
    });

    it('cleans up the temporary textarea when fallback copy throws', async () => {
        const appendedNodes: unknown[] = [];
        const removedNodes: unknown[] = [];
        const textarea = {
            value: '',
            style: {} as Record<string, string>,
            setAttribute: vi.fn(),
            focus: vi.fn(),
            select: vi.fn(),
        };
        const body = {
            appendChild: vi.fn((node: unknown) => {
                appendedNodes.push(node);
            }),
            removeChild: vi.fn((node: unknown) => {
                removedNodes.push(node);
            }),
        };

        vi.stubGlobal('navigator', {
            clipboard: {
                writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
            },
        });
        vi.stubGlobal('document', {
            body,
            createElement: vi.fn(() => textarea),
            execCommand: vi.fn(() => {
                throw new Error('copy failed');
            }),
        });

        await expect(copyTextToClipboard('const x = 1;')).resolves.toBe(false);
        expect(body.appendChild).toHaveBeenCalledWith(textarea);
        expect(body.removeChild).toHaveBeenCalledWith(textarea);
        expect(appendedNodes).toEqual([textarea]);
        expect(removedNodes).toEqual([textarea]);
    });
});
