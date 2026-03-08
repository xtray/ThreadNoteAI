# Chat Settings Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the AI chat settings modal into top horizontal tabs so model settings, provider settings, and advanced settings are easier to scan and configure.

**Architecture:** Keep configuration data and actions in Redux unchanged, and limit the redesign to `SettingsPanel.tsx` and scoped CSS in `src/index.css`. Add local UI state for the active tab, render one tab body at a time, and cover the new information architecture with focused component tests.

**Tech Stack:** React, TypeScript, Redux Toolkit, React Testing Library, Vitest, CSS

---

### Task 1: Add failing tests for the tabbed settings structure

**Files:**
- Modify: `src/components/Chat/ChatContainer.test.ts`
- Modify: `src/components/Settings/SettingsPanel.tsx`

**Step 1: Write the failing test**

Add tests that:
- open the settings panel through Redux-backed render state,
- assert `Models` is selected by default,
- assert model controls are visible while provider controls are hidden on the default tab,
- switch to `Providers` and assert built-in/custom provider controls appear,
- switch to `Advanced` and assert only advanced controls are shown.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/Chat/ChatContainer.test.ts`
Expected: FAIL because the settings panel does not expose tab navigation yet.

### Task 2: Implement the tabbed settings layout

**Files:**
- Modify: `src/components/Settings/SettingsPanel.tsx`

**Step 1: Add local tab state**

Introduce a union type for the settings tabs and initialize local component state to `models`.

**Step 2: Restructure header and tab navigation**

Render a tab row under the modal header with buttons for `Models`, `Providers`, and `Advanced`, using selected state for accessibility and styling hooks.

**Step 3: Move settings into tab-specific sections**

Render:
- `Models`: main concurrent models, default main model slots, sub-thread model.
- `Providers`: built-in API keys plus custom provider cards and model drag/drop UI.
- `Advanced`: sub-session context mode and supporting explanatory copy.

**Step 4: Keep existing interactions intact**

Preserve current dispatches, key visibility toggles, custom provider editing, and model drag-and-drop behavior without changing persistence logic.

### Task 3: Add scoped styles for tabs and content layout

**Files:**
- Modify: `src/index.css`

**Step 1: Add settings tab strip styles**

Define the tab row, tab button, active state, and content area spacing consistent with the existing modal design language.

**Step 2: Refine section/card styling for per-tab layout**

Add any small supporting styles needed for grouped provider cards, advanced hints, and better content rhythm inside the tabbed layout.

**Step 3: Verify note settings styles remain unaffected**

Keep selectors scoped to the AI settings modal classes rather than broad shared settings selectors.

### Task 4: Verify the redesign

**Files:**
- Test: `src/components/Chat/ChatContainer.test.ts`

**Step 1: Re-run targeted settings tests**

Run: `npm test -- src/components/Chat/ChatContainer.test.ts`
Expected: PASS

**Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Run the production build**

Run: `npm run build`
Expected: PASS
