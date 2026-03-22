# MiniMax Dual-Series Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep built-in MiniMax M2.7 as the default while restoring built-in MiniMax M2.5 as a selectable option.

**Architecture:** Update the built-in model registry in `src/utils/models.ts`, because settings selectors and config sanitization already read from that single source of truth. Add test coverage for default behavior and for the presence of both MiniMax series in built-in model options.

**Tech Stack:** TypeScript, React, Redux Toolkit, Vitest, Vite

---

### Task 1: Add failing tests for dual MiniMax built-in support

**Files:**
- Modify: `src/store/slices/configSlice.test.ts`
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

- Assert `DEFAULT_MODEL_ID` stays `MiniMax-M2.7`.
- Assert `AVAILABLE_MODELS` contains `MiniMax-M2.5`, `MiniMax-M2.5-highspeed`, `MiniMax-M2.7`, and `MiniMax-M2.7-highspeed`.
- Assert the models settings UI contains both `MiniMax M2.5` and `MiniMax M2.7`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/store/slices/configSlice.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because the built-in registry currently only includes `MiniMax-M2.7`.

**Step 3: Write minimal implementation**

No production change in this task.

**Step 4: Re-run to confirm the failure reason**

Run the same command and confirm the missing `MiniMax-M2.5` entries cause the failure.

**Step 5: Commit**

```bash
git add src/store/slices/configSlice.test.ts src/components/Settings/SettingsPanel.test.tsx
git commit -m "test: cover dual minimax built-in model support"
```

### Task 2: Restore MiniMax M2.5 built-in entries while preserving the default

**Files:**
- Modify: `src/utils/models.ts`

**Step 1: Reuse the failing tests**

Use the red state from Task 1.

**Step 2: Run test to verify it still fails before implementation**

Run: `npm test -- src/store/slices/configSlice.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL before the registry update.

**Step 3: Write minimal implementation**

- Keep `DEFAULT_MODEL_ID` as `MiniMax-M2.7`.
- Add built-in `MiniMax-M2.5` and `MiniMax-M2.5-highspeed` entries back into `AVAILABLE_MODELS`.
- Leave `MiniMax-M2.7` entries intact.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/store/slices/configSlice.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/utils/models.ts
git commit -m "feat: keep minimax m2.5 built-in alongside m2.7"
```

### Task 3: Run verification gate

**Files:**
- Modify: none

**Step 1: Run full tests**

Run: `npm test`
Expected: PASS.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS.

**Step 3: Record evidence**

Report exact verification results and any remaining caveats.
