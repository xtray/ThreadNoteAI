import { describe, expect, it } from 'vitest';
import {
    orderModelOptionsBySelection,
    projectRootSessionMessagesByRoundTabs,
    resolveRoundTabModelId,
    shouldAutoScrollMessageList,
} from './ChatContainer';

describe('orderModelOptionsBySelection', () => {
    it('puts selected models first and keeps remaining models in original order', () => {
        const options = [
            { id: 'm1', displayName: 'Model 1' },
            { id: 'm2', displayName: 'Model 2' },
            { id: 'm3', displayName: 'Model 3' },
            { id: 'm4', displayName: 'Model 4' },
        ];

        const ordered = orderModelOptionsBySelection(options, ['m3', 'm1']);

        expect(ordered.map((item) => item.id)).toEqual(['m3', 'm1', 'm2', 'm4']);
    });

    it('ignores unknown selected ids and keeps uniqueness', () => {
        const options = [
            { id: 'm1', displayName: 'Model 1' },
            { id: 'm2', displayName: 'Model 2' },
            { id: 'm3', displayName: 'Model 3' },
        ];

        const ordered = orderModelOptionsBySelection(options, ['mX', 'm2', 'm2']);

        expect(ordered.map((item) => item.id)).toEqual(['m2', 'm1', 'm3']);
    });
});

describe('resolveRoundTabModelId', () => {
    it('prefers per-round active tab model and falls back to message model then first model', () => {
        const round = {
            id: 'round-1',
            modelOrder: ['model-a', 'model-b'],
            modelReplies: {
                'model-a': { content: 'A', status: 'done' as const },
                'model-b': { content: 'B', status: 'done' as const },
            },
        };

        expect(resolveRoundTabModelId({
            rounds: { 'round-1': round },
            activeRoundId: 'round-1',
            activeTabModelId: 'model-a',
            roundActiveTabModelIds: { 'round-1': 'model-b' },
            primaryModelId: 'model-a',
            lastUsedSelectedModelIds: [],
        }, round, 'round-1', 'model-a')).toBe('model-b');

        expect(resolveRoundTabModelId({
            rounds: { 'round-1': round },
            activeRoundId: 'round-1',
            activeTabModelId: 'model-a',
            roundActiveTabModelIds: {},
            primaryModelId: 'model-a',
            lastUsedSelectedModelIds: [],
        }, round, 'round-1', 'model-b')).toBe('model-b');

        expect(resolveRoundTabModelId({
            rounds: { 'round-1': round },
            activeRoundId: 'round-1',
            activeTabModelId: 'model-a',
            roundActiveTabModelIds: {},
            primaryModelId: 'model-a',
            lastUsedSelectedModelIds: [],
        }, round, 'round-1', 'model-x')).toBe('model-a');
    });
});

describe('projectRootSessionMessagesByRoundTabs', () => {
    it('projects each assistant message by its own round active tab', () => {
        const session = {
            id: 'main',
            parentId: null,
            anchorText: null,
            anchorMessageId: null,
            modelId: 'model-a',
            isLoading: false,
            multiReplyEnabled: true,
            messages: [
                { id: 'u1', role: 'user', content: 'Q1', timestamp: 1 },
                { id: 'a1', role: 'assistant', content: 'fallback-1', timestamp: 2, modelId: 'model-a', roundId: 'round-1' },
                { id: 'u2', role: 'user', content: 'Q2', timestamp: 3 },
                { id: 'a2', role: 'assistant', content: 'fallback-2', timestamp: 4, modelId: 'model-c', roundId: 'round-2' },
            ],
            multiModel: {
                rounds: {
                    'round-1': {
                        id: 'round-1',
                        modelOrder: ['model-a', 'model-b'],
                        modelReplies: {
                            'model-a': { content: 'R1-A', status: 'done' as const },
                            'model-b': { content: 'R1-B', status: 'done' as const },
                        },
                    },
                    'round-2': {
                        id: 'round-2',
                        modelOrder: ['model-c', 'model-d'],
                        modelReplies: {
                            'model-c': { content: 'R2-C', status: 'done' as const },
                            'model-d': { content: 'R2-D', status: 'done' as const },
                        },
                    },
                },
                activeRoundId: 'round-2',
                activeTabModelId: 'model-c',
                roundActiveTabModelIds: {
                    'round-1': 'model-b',
                    'round-2': 'model-c',
                },
                primaryModelId: 'model-c',
                lastUsedSelectedModelIds: ['model-a', 'model-b'],
            },
        };

        const projected = projectRootSessionMessagesByRoundTabs(session as any);
        const assistants = projected.filter((m) => m.role === 'assistant');

        expect(assistants.map((m) => m.content)).toEqual(['R1-B', 'R2-C']);
        expect(assistants.map((m) => m.modelId)).toEqual(['model-b', 'model-c']);
    });
});

describe('shouldAutoScrollMessageList', () => {
    it('does not scroll to bottom when regenerating an older turn only flips loading on', () => {
        expect(shouldAutoScrollMessageList({
            previous: {
                sessionId: 'main',
                messageCount: 6,
                lastMessageId: 'a3',
                lastMessageContent: 'Latest answer',
                isLoading: false,
            },
            next: {
                sessionId: 'main',
                messageCount: 6,
                lastMessageId: 'a3',
                lastMessageContent: 'Latest answer',
                isLoading: true,
            },
            hasSearchQuery: false,
        })).toBe(false);
    });

    it('scrolls when a new message is appended at the bottom', () => {
        expect(shouldAutoScrollMessageList({
            previous: {
                sessionId: 'main',
                messageCount: 5,
                lastMessageId: 'u3',
                lastMessageContent: 'Question',
                isLoading: false,
            },
            next: {
                sessionId: 'main',
                messageCount: 6,
                lastMessageId: 'a3',
                lastMessageContent: '',
                isLoading: true,
            },
            hasSearchQuery: false,
        })).toBe(true);
    });
});
