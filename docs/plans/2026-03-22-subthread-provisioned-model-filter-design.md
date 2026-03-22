# Sub-thread Provisioned Model Filter Design

## Goal

Hide unprovisioned AI models from sub-thread model selection UI in AI settings and AI chat mode, while keeping existing persisted config behavior stable.

## Recommended Approach

Use a shared helper that derives "provisioned" model options for UI pickers only.

- Built-in models are provisioned when their built-in provider has a non-empty API key in `config.apiKeys`.
- Custom models are provisioned when their custom provider has:
  - a non-empty `baseUrl`
  - a non-empty `apiKey`
  - at least one non-empty model name

This keeps catalog and fallback logic unchanged while making both sub-thread model pickers consistent.

## UI Scope

- AI settings `Sub-thread Model` select
- AI chat mode sub-thread model selection list

## Behavior Notes

- Do not globally redefine model availability in config sanitization.
- Filter only the picker options shown to the user.
- Preserve existing selected IDs in state unless the picker cannot render them safely.

## Testing

- Add helper tests for built-in and custom provisioning rules.
- Add settings UI coverage to confirm unprovisioned models are hidden from the sub-thread selector.
- Add chat picker coverage around the shared filtered options helper.
