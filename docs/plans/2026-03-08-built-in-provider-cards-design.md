# Built-In Provider Cards Design

**User Intent:** Make the built-in provider key area visually consistent with custom provider cards so the whole `Providers` tab feels like one coherent settings surface.

## Scope
- In scope:
- Present each built-in provider key row as a lightweight card.
- Keep the existing API key input behavior unchanged.
- Align built-in provider spacing and headers with the custom provider area.
- Out of scope:
- Any config or persistence changes.
- Collapsible behavior for built-in providers.

## Recommendation
Keep built-in providers simpler than custom providers, but give each provider its own card shell with consistent spacing, radius, and action alignment. This preserves the lower complexity of built-in providers while visually matching the rest of the page.

## Testing Strategy
- Extend the settings component test to verify built-in provider cards render a shared card class and provider control classes.
