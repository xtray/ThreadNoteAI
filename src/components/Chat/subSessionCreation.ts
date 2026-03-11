import { ChatSession, Message, MessageAnnotation } from '../../store/slices/sessionSlice';

export type CreateSubSessionArtifacts = {
    subSessionId: string;
    nextSession: ChatSession;
    annotation: MessageAnnotation;
};

type CreateSubSessionArtifactsArgs = {
    parentMessageId: string;
    anchorText: string;
    sourceSession: ChatSession;
    modelId: string;
    contextMode: 'new' | 'keep';
    timestamp: number;
};

export const createSubSessionArtifacts = ({
    parentMessageId,
    anchorText,
    sourceSession,
    modelId,
    contextMode,
    timestamp,
}: CreateSubSessionArtifactsArgs): CreateSubSessionArtifacts => {
    const trimmedAnchor = anchorText.trim();
    const subSessionId = `sub-${timestamp}`;
    const annotationId = `anno-${timestamp}`;
    const mainContextSnapshotMessages: Message[] = sourceSession.messages.map((message) => ({
        ...message,
        annotations: message.annotations ? message.annotations.map((annotation) => ({ ...annotation })) : [],
    }));

    return {
        subSessionId,
        nextSession: {
            id: subSessionId,
            parentId: sourceSession.id,
            anchorText: trimmedAnchor,
            anchorMessageId: parentMessageId,
            messages: [],
            modelId,
            isLoading: false,
            contextMode,
            mainContextSnapshotMessages,
        },
        annotation: {
            id: annotationId,
            subSessionId,
            anchorText: trimmedAnchor,
            createdAt: timestamp,
        },
    };
};
