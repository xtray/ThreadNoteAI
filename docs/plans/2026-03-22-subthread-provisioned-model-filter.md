# Sub-thread Provisioned Model Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide unprovisioned models from sub-thread model pickers in AI settings and chat mode.

**Architecture:** Add a shared helper in the model display utilities that derives provisioned built-in and custom model options from config. Reuse that helper in settings and chat UI without changing config persistence or fallback sanitization.

**Tech Stack:** React, Redux Toolkit, Vitest, TypeScript

---

### Task 1: Add failing tests for provisioned model filtering

**Files:**
- Modify: `src/utils/modelDisplay.test.ts`
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing tests**

- Add helper tests that verify built-in models only appear when the matching built-in provider has an API key.
- Add helper tests that verify custom models only appear when the custom provider has `baseUrl`, `apiKey`, and model names.
- Add a settings panel test that verifies the sub-thread model select omits unprovisioned built-in models and keeps provisioned custom models.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/modelDisplay.test.ts src/components/Settings/SettingsPanel.test.tsx`

Expected: FAIL because provisioned filtering is not implemented yet.

### Task 2: Implement shared provisioned model option helper

**Files:**
- Modify: `src/utils/modelDisplay.ts`

**Step 1: Write minimal implementation**

- Add a helper that accepts built-in API keys and custom providers.
- Return grouped model options limited to provisioned built-in and provisioned custom entries.

**Step 2: Run focused tests**

Run: `npm test -- src/utils/modelDisplay.test.ts`

Expected: PASS

### Task 3: Use provisioned options in settings and chat sub-thread pickers

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/components/Chat/FloatingOverlay.tsx`

**Step 1: Update settings sub-thread picker**

- Replace the current all-model list with the shared provisioned helper.

**Step 2: Update chat sub-thread picker**

- Replace the current all-model list for the sub-thread model selection surface with the shared provisioned helper.

**Step 3: Run focused tests**

Run: `npm test -- src/components/Settings/SettingsPanel.test.tsx`

Expected: PASS

### Task 4: Verify project checks

**Files:**
- Modify: `src/utils/modelDisplay.ts`
- Modify: `src/utils/modelDisplay.test.ts`
- Modify: `src/components/Settings/SettingsPanel.tsx`
- Modify: `src/components/Settings/SettingsPanel.test.tsx`
- Modify: `src/components/Chat/FloatingOverlay.tsx`

**Step 1: Run relevant tests**

Run: `npm test -- src/utils/modelDisplay.test.ts src/components/Settings/SettingsPanel.test.tsx`

Expected: PASS

**Step 2: Run build**

Run: `npm run build`

Expected: PASS
