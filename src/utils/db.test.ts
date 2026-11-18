import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('IndexedDB connection lifecycle', () => {
  it('retries opening after a transient failure', async () => {
    const requests: any[] = [];
    const open = vi.fn(() => { const request = {}; requests.push(request); return request; });
    vi.stubGlobal('indexedDB', { open });
    const { initDB } = await import('./db');
    const failed = initDB();
    const assertion = expect(failed).rejects.toThrow('temporary failure');
    requests[0].error = new Error('temporary failure');
    requests[0].onerror();
    await assertion;
    const retry = initDB();
    void retry.catch(() => {});
    if (requests[1]) {
      requests[1].result = { close: vi.fn() };
      requests[1].onsuccess();
    }
    expect(open).toHaveBeenCalledTimes(2);
    await expect(retry).resolves.toBe(requests[1].result);
  });

  it('closes an obsolete connection and reopens after a version change', async () => {
    const requests: any[] = [];
    const open = vi.fn(() => { const request = {}; requests.push(request); return request; });
    vi.stubGlobal('indexedDB', { open });
    const { initDB } = await import('./db');
    const pending = initDB();
    const connection = { close: vi.fn(), onversionchange: undefined as any };
    requests[0].result = connection;
    requests[0].onsuccess();
    await pending;
    connection.onversionchange?.();
    expect(connection.close).toHaveBeenCalledOnce();
    const reopened = initDB();
    expect(open).toHaveBeenCalledTimes(2);
    requests[1].result = { close: vi.fn() };
    requests[1].onsuccess();
    await expect(reopened).resolves.toBe(requests[1].result);
  });
  it('does not invalidate a replacement connection when the old close event arrives late', async () => {
    const requests: any[] = [];
    const open = vi.fn(() => { const request = {}; requests.push(request); return request; });
    vi.stubGlobal('indexedDB', { open });
    const { initDB } = await import('./db');
    const pending = initDB();
    const old = { close: vi.fn(), onversionchange: undefined as any, onclose: undefined as any };
    requests[0].result = old;
    requests[0].onsuccess();
    await pending;
    old.onversionchange();
    const next = initDB();
    const replacement = { close: vi.fn() };
    requests[1].result = replacement;
    requests[1].onsuccess();
    await next;
    old.onclose();
    const reused = initDB();
    expect(open).toHaveBeenCalledTimes(2);
    await expect(reused).resolves.toBe(replacement);
  });

});
