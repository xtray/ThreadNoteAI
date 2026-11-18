# Long reply continuation design

Approved: automatically continue token-limited replies in the same message.
Detect OpenAI length, Anthropic max_tokens, and Google MAX_TOKENS in SSE and JSON fallbacks. Keep each request's token budget compatible with existing models. Append cumulative text and request continuation using the original history plus the generated assistant response and a continuation instruction. Share the AbortSignal across requests. Never continue ordinary stops, errors, or cancellation. Reject empty truncated replies or more than 32 continuations explicitly, preserving displayed text through existing saga error handling.
