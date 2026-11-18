import { afterEach, describe, expect, it, vi } from 'vitest';
import { callAIStream } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('AI streaming transport', () => {
    it('preserves repeated Google text deltas', async () => {
        const event = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ha' }] } }] })}\n\n`;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(event + event, {
            headers: { 'content-type': 'text/event-stream' },
        })));
        expect(await callAIStream('gemini-1.5-flash-latest', [], { apiKeys: { google: 'test' }, customProviders: [] }, vi.fn())).toBe('haha');
    });

    it('rejects and disconnects when the extension stream reports an SSE error', async () => {
        vi.stubGlobal('window', { location: { protocol: 'chrome-extension:' } });
        let listener: (message: unknown) => void = () => {};
        let requestId = '';
        const disconnect = vi.fn();
        const port = {
            onMessage: { addListener: (fn: typeof listener) => { listener = fn; }, removeListener: vi.fn() },
            onDisconnect: { addListener: vi.fn(), removeListener: vi.fn() },
            disconnect,
            postMessage: (message: { requestId: string }) => { requestId = message.requestId; },
        };
        vi.stubGlobal('chrome', { runtime: { connect: () => port } });
        const pending = callAIStream('gpt-4o', [], { apiKeys: { openai: 'test' }, customProviders: [] }, vi.fn());
        const rejection = expect(pending).rejects.toThrow('quota exceeded');
        listener({ type: 'response', requestId, ok: true, status: 200, contentType: 'text/event-stream' });
        expect(() => listener({ type: 'chunk', requestId, chunk: 'data: {"error":{"message":"quota exceeded"}}\n\n' })).not.toThrow();
        await rejection;
        expect(disconnect).toHaveBeenCalledOnce();
    });
});
