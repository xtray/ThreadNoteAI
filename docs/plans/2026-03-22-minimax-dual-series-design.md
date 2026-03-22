# MiniMax Dual-Series Design

**User Intent:** Keep the new built-in `MiniMax-M2.7` series as the default while also retaining the old built-in `MiniMax-M2.5` series so users can switch to it manually.

## Scope
- Keep `DEFAULT_MODEL_ID` as `MiniMax-M2.7`.
- Restore built-in `MiniMax-M2.5` and `MiniMax-M2.5-highspeed`.
- Keep `MiniMax-M2.7` and `MiniMax-M2.7-highspeed`.
- Update tests so they verify both series are available while the default remains `MiniMax-M2.7`.

## Options
1. Keep only `MiniMax-M2.7`.
- Pros: simplest.
- Cons: does not satisfy the request.

2. Keep both built-in series and leave the default on `MiniMax-M2.7`.
- Pros: matches requested behavior and requires only a small registry update.
- Cons: adds two more items to built-in model selectors.

3. Re-add `MiniMax-M2.5` as custom-only entries.
- Pros: avoids touching built-in registry.
- Cons: does not feel built-in and complicates user setup.

## Recommendation
Choose option 2. The built-in model registry is already the single source of truth for settings selectors and config sanitization, so restoring the old series there gives users the choice they want without changing routing or provider logic.

## Testing
- Add tests that assert both `MiniMax-M2.5` and `MiniMax-M2.7` exist in built-in options.
- Keep default assertions pinned to `MiniMax-M2.7`.
- Run focused tests, then full `npm test` and `npm run build`.
