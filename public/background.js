chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

const streamControllers = new Map();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'threadnote:proxy-fetch') return;

  (async () => {
    try {
      const response = await fetch(message.url, {
        method: message.method || 'POST',
        headers: message.headers || {},
        body: message.body ? JSON.stringify(message.body) : undefined,
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      sendResponse({
        ok: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      sendResponse({
        ok: false,
        status: 0,
        error: error?.message || 'Proxy fetch failed',
      });
    }
  })();

  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'threadnote:proxy-stream') return;

  let activeRequestId = null;

  const cleanup = (requestId) => {
    if (!requestId) return;
    streamControllers.delete(requestId);
    if (activeRequestId === requestId) {
      activeRequestId = null;
    }
  };

  const abortRequest = (requestId) => {
    const controller = streamControllers.get(requestId);
    if (controller) {
      controller.abort();
      cleanup(requestId);
    }
  };

  port.onMessage.addListener((message) => {
    if (!message || typeof message !== 'object') return;

    if (message.type === 'cancel' && typeof message.requestId === 'string') {
      abortRequest(message.requestId);
      return;
    }

    if (message.type !== 'start' || typeof message.requestId !== 'string') return;

    const requestId = message.requestId;
    activeRequestId = requestId;

    (async () => {
      const controller = new AbortController();
      streamControllers.set(requestId, controller);

      try {
        const response = await fetch(message.url, {
          method: message.method || 'POST',
          headers: message.headers || {},
          body: message.body ? JSON.stringify(message.body) : undefined,
          signal: controller.signal,
        });

        port.postMessage({
          type: 'response',
          requestId,
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type') || '',
        });

        if (!response.body) {
          port.postMessage({ type: 'done', requestId });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length > 0) {
            port.postMessage({
              type: 'chunk',
              requestId,
              chunk: decoder.decode(value, { stream: true }),
            });
          }
        }

        const tail = decoder.decode();
        if (tail) {
          port.postMessage({ type: 'chunk', requestId, chunk: tail });
        }
        port.postMessage({ type: 'done', requestId });
      } catch (error) {
        const cancelled = error?.name === 'AbortError';
        port.postMessage({
          type: cancelled ? 'aborted' : 'error',
          requestId,
          error: error?.message || 'Proxy stream failed',
        });
      } finally {
        cleanup(requestId);
      }
    })();
  });

  port.onDisconnect.addListener(() => {
    if (activeRequestId) {
      abortRequest(activeRequestId);
    }
  });
});
