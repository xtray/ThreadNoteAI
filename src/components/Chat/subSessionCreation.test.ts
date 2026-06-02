import { describe, expect, it } from 'vitest';
import type { ChatSession } from '../../store/slices/sessionSlice';
import { createSubSessionArtifacts } from './subSessionCreation';

describe('createSubSessionArtifacts', () => {
    it('creates a trimmed sub-session payload and annotation from the source session', () => {
        const sourceSession: ChatSession = {
            id: 'session-1',
            parentId: 'message-root',
            anchorText: 'parent anchor',
            anchorMessageId: 'message-root',
            messages: [
                {
                    id: 'm1',
                    role: 'assistant',
                    content: 'Alpha',
                    timestamp: 1,
                    annotations: [
                        {
                            id: 'anno-old',
                            subSessionId: 'sub-old',
                            anchorText: 'Alpha',
                            createdAt: 1,
                        },
                    ],
                },
            ],
            modelId: 'deepseek-chat',
            isLoading: false,
            contextMode: 'keep',
        };

        const result = createSubSessionArtifacts({
            parentMessageId: 'm1',
            anchorText: '  Beta  ',
            sourceSession,
            modelId: 'glm-4.5',
            contextMode: 'new',
            timestamp: 123,
            anchorOccurrenceIndex: 2,
        });

        expect(result.subSessionId).toBe('sub-123');
        expect(result.annotation).toEqual({
            id: 'anno-123',
            subSessionId: 'sub-123',
            anchorText: 'Beta',
            createdAt: 123,
            anchorOccurrenceIndex: 2,
        });
        expect(result.nextSession.parentId).toBe('session-1');
        expect(result.nextSession.anchorText).toBe('Beta');
        expect(result.nextSession.anchorMessageId).toBe('m1');
        expect(result.nextSession.modelId).toBe('glm-4.5');
        expect(result.nextSession.contextMode).toBe('new');
        expect(result.nextSession.mainContextSnapshotMessages).toEqual([
            {
                id: 'm1',
                role: 'assistant',
                content: 'Alpha',
                timestamp: 1,
                annotations: [
                    {
                        id: 'anno-old',
                        subSessionId: 'sub-old',
                        anchorText: 'Alpha',
                        createdAt: 1,
                    },
                ],
            },
        ]);
        expect(result.nextSession.mainContextSnapshotMessages).not.toBe(sourceSession.messages);
        expect(result.nextSession.mainContextSnapshotMessages![0]).not.toBe(sourceSession.messages[0]);
        expect(result.nextSession.mainContextSnapshotMessages![0].annotations).not.toBe(sourceSession.messages[0].annotations);
    });
});
