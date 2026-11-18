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

describe('token-limit continuation', () => {
    const config = { apiKeys: { openai: 'test', anthropic: 'test', google: 'test' }, customProviders: [] };
    const sse = (events: unknown[]) => new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), {
        headers: { 'content-type': 'text/event-stream' },
    });
    it.each([
        ['gpt-4o', [{ choices: [{ delta: { content: 'first' }, finish_reason: 'length' }] }], [{ choices: [{ delta: { content: 'second' }, finish_reason: 'stop' }] }]],
        ['claude-3-5-sonnet-latest', [{ type: 'content_block_delta', delta: { text: 'first' } }, { type: 'message_delta', delta: { stop_reason: 'max_tokens' } }], [{ type: 'content_block_delta', delta: { text: 'second' } }, { type: 'message_delta', delta: { stop_reason: 'end_turn' } }]],
        ['gemini-1.5-flash-latest', [{ candidates: [{ content: { parts: [{ text: 'first' }] }, finishReason: 'MAX_TOKENS' }] }], [{ candidates: [{ content: { parts: [{ text: 'second' }] }, finishReason: 'STOP' }] }]],
    ])('continues %s and preserves cumulative output', async (model, first, second) => {
        const fetchMock = vi.fn().mockResolvedValueOnce(sse(first)).mockResolvedValueOnce(sse(second));
        vi.stubGlobal('fetch', fetchMock);
        const updates = vi.fn();
        expect(await callAIStream(model as string, [], config, updates)).toBe('firstsecond');
        expect(updates.mock.calls.map(call => call[0])).toEqual(['first', 'firstsecond']);
        const body = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(JSON.stringify(body)).toContain('first');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('continues JSON fallback responses too', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: 'first' }, finish_reason: 'length' }] }))
            .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: 'second' }, finish_reason: 'stop' }] })));
        expect(await callAIStream('gpt-4o', [], config, vi.fn())).toBe('firstsecond');
    });
    it('does not continue a normal stop', async () => {
        const fetchMock = vi.fn().mockResolvedValue(sse([{ choices: [{ delta: { content: 'done' }, finish_reason: 'stop' }] }]));
        vi.stubGlobal('fetch', fetchMock);
        expect(await callAIStream('gpt-4o', [], config, vi.fn())).toBe('done');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('honors cancellation between requests', async () => {
        const controller = new AbortController();
        const fetchMock = vi.fn().mockResolvedValue(sse([{ choices: [{ delta: { content: 'first' }, finish_reason: 'length' }] }]));
        vi.stubGlobal('fetch', fetchMock);
        await expect(callAIStream('gpt-4o', [], config, () => controller.abort(), controller.signal))
            .rejects.toMatchObject({ name: 'AbortError' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('forwards the same cancellation signal to continuation requests', async () => {
        const controller = new AbortController();
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(sse([{ choices: [{ delta: { content: 'first' }, finish_reason: 'length' }] }]))
            .mockImplementationOnce((_url, options) => {
                expect(options.signal).toBe(controller.signal);
                controller.abort();
                return Promise.reject(new DOMException('Aborted', 'AbortError'));
            });
        vi.stubGlobal('fetch', fetchMock);
        await expect(callAIStream('gpt-4o', [], config, vi.fn(), controller.signal))
            .rejects.toMatchObject({ name: 'AbortError' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('preserves displayed text and surfaces continuation errors', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(sse([{ choices: [{ delta: { content: 'first' }, finish_reason: 'length' }] }]))
            .mockRejectedValueOnce(new Error('network failure'));
        vi.stubGlobal('fetch', fetchMock);
        const updates = vi.fn();
        await expect(callAIStream('gpt-4o', [], config, updates)).rejects.toThrow('network failure');
        expect(updates).toHaveBeenLastCalledWith('first');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('rejects a token-limited reply without text instead of looping', async () => {
        const fetchMock = vi.fn().mockResolvedValue(sse([{ choices: [{ delta: {}, finish_reason: 'length' }] }]));
        vi.stubGlobal('fetch', fetchMock);
        await expect(callAIStream('gpt-4o', [], config, vi.fn())).rejects.toThrow('未返回正文');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('bounds repeated continuations and reports incomplete output', async () => {
        const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(sse([{ choices: [{ delta: { content: 'x' }, finish_reason: 'length' }] }])));
        vi.stubGlobal('fetch', fetchMock);
        await expect(callAIStream('gpt-4o', [], config, vi.fn())).rejects.toThrow('续写次数上限');
        expect(fetchMock).toHaveBeenCalledTimes(33);
    });

    it('continues through extension ports and emits cumulative output', async () => {
        vi.stubGlobal('window', { location: { protocol: 'chrome-extension:' } });
        const disconnects: ReturnType<typeof vi.fn>[] = [];
        const connect = vi.fn(() => {
            let listener: (message: unknown) => void = () => {};
            const disconnect = vi.fn();
            disconnects.push(disconnect);
            return {
                onMessage: { addListener: (fn: typeof listener) => { listener = fn; }, removeListener: vi.fn() },
                onDisconnect: { addListener: vi.fn(), removeListener: vi.fn() },
                disconnect,
                postMessage: ({ requestId }: { requestId: string }) => queueMicrotask(() => {
                    const first = disconnects.length === 1;
                    listener({ type: 'response', requestId, ok: true, status: 200, contentType: 'text/event-stream' });
                    listener({ type: 'chunk', requestId, chunk: 'data: ' + JSON.stringify({ choices: [{ delta: { content: first ? 'first' : 'second' }, finish_reason: first ? 'length' : 'stop' }] }) + '\n\n' });
                    listener({ type: 'done', requestId });
                }),
            };
        });
        vi.stubGlobal('chrome', { runtime: { connect } });
        const updates = vi.fn();
        expect(await callAIStream('gpt-4o', [], config, updates)).toBe('firstsecond');
        expect(updates).toHaveBeenLastCalledWith('firstsecond');
        expect(connect).toHaveBeenCalledTimes(2);
        disconnects.forEach(disconnect => expect(disconnect).toHaveBeenCalledOnce());
    });

});
