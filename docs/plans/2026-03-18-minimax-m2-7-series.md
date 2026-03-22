# MiniMax M2.7 Series Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade built-in MiniMax model series from M2.5 to M2.7 and keep defaults and tests consistent.

**Architecture:** Update the single source of built-in model truth in `src/utils/models.ts`, then align tests that rely on built-in default and fallback model IDs. Keep provider routing and request payload code unchanged.

**Tech Stack:** TypeScript, React, Redux Toolkit, Vitest, Vite

---

### Task 1: Update tests first for MiniMax M2.7 expectations

**Files:**
- Modify: `src/utils/aiConfigTransfer.test.ts`
- Modify: `src/components/Settings/SettingsPanel.test.tsx`

**Step 1: Write the failing test**

Change all `MiniMax-M2.5` assertions/fixtures to `MiniMax-M2.7` (and `MiniMax-M2.5-highspeed` references to `MiniMax-M2.7-highspeed` if present).

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/aiConfigTransfer.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL because production model registry still uses M2.5.

**Step 3: Write minimal implementation**

No production change in this task.

**Step 4: Run test to verify failure reason is correct**

Run the same command and confirm mismatch points to built-in model IDs/defaults.

**Step 5: Commit**

```bash
git add src/utils/aiConfigTransfer.test.ts src/components/Settings/SettingsPanel.test.tsx
git commit -m "test: expect minimax m2.7 built-in defaults"
```

### Task 2: Update built-in MiniMax models and defaults

**Files:**
- Modify: `src/utils/models.ts`

**Step 1: Write the failing test**

Reuse Task 1 failing tests as red state.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/aiConfigTransfer.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: FAIL before implementation.

**Step 3: Write minimal implementation**

- Set `DEFAULT_MODEL_ID` to `MiniMax-M2.7`.
- Replace built-in MiniMax entries:
- `MiniMax-M2.5` -> `MiniMax-M2.7`
- `MiniMax-M2.5-highspeed` -> `MiniMax-M2.7-highspeed`
- Update display names to `MiniMax M2.7` variants.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/aiConfigTransfer.test.ts src/components/Settings/SettingsPanel.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/utils/models.ts
git commit -m "feat: upgrade built-in minimax model series to m2.7"
```

### Task 3: Full verification gate

**Files:**
- Modify: none
- Test: full repository tests and build

**Step 1: Run all tests**

Run: `npm test`
Expected: PASS.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS.

**Step 3: Record evidence**

Capture command outputs and report exact status and any residual risk.

**Step 4: Commit (if needed)**

```bash
# no additional commit required unless fixes are made during verification
```
