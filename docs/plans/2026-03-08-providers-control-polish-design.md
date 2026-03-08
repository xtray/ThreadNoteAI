# Providers Control Polish Design

**User Intent:** Make the `Providers` tab feel visually consistent by aligning built-in key rows and custom provider form controls around one shared input and button language.

## Scope
- In scope:
- Unify input hover/focus treatment across built-in and custom provider fields.
- Unify button corner radius, padding, and focus behavior for visibility, add, and delete actions.
- Normalize vertical spacing inside custom provider cards and built-in key rows.
- Out of scope:
- Changing settings information architecture.
- Adding new provider functionality.

## Recommendation
Use a single shared visual treatment for provider-related form controls. Inputs should share height, border, radius, and focus ring behavior. Secondary buttons should share spacing and radius, while destructive buttons keep their red semantic color but adopt the same structural sizing.

## Visual Rules
- Provider text inputs and key inputs use the same height and radius.
- Hover adds a subtle border emphasis; focus uses the same accent ring everywhere.
- Inline control buttons use the same base size and radius.
- Custom provider cards use one consistent internal spacing rhythm between fields and actions.

## Testing Strategy
- Extend settings component tests with stable hook classes for provider inputs/buttons.
- Verify built-in key rows and custom provider cards render the shared provider control classes.
