# Rotating Glow Border Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rotating glowing 2px border to `contained primary` MUI buttons that activates on hover.

**Architecture:** A CSS custom property `--rotation` (typed `<angle>` via `@property`) is animated from `0deg` to `360deg` by a global `@keyframes spin` rule. On hover, the MUI button theme override adds `::before` (spinning gradient) and `::after` (solid interior cover) pseudo-elements that together create the 2px glow ring effect.

**Tech Stack:** React 18, MUI v5, Emotion, TypeScript, Vitest

---

### Task 0: Create feature branch

**Files:** none

- [ ] **Step 1: Create and switch to a feature branch**

```bash
git checkout -b feat/rotating-glow-button
```

Expected: `Switched to a new branch 'feat/rotating-glow-button'`

---

### Task 1: Add `@property` and `@keyframes` to global CSS

**Files:**
- Modify: `src/index.css`

The file already uses `@property` for `--posx` and `--posy` (lines 36–46). Add the new declarations in the same block.

- [ ] **Step 1: Add the `@property` and `@keyframes` blocks to `src/index.css`**

Insert after line 46 (after the existing `@property --posy` block):

```css
@property --rotation {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes spin {
  to { --rotation: 360deg; }
}
```

- [ ] **Step 2: Verify the dev server still compiles**

Run: `npm run dev`  
Expected: no console errors, app loads normally. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: register --rotation CSS property and spin keyframes"
```

---

### Task 2: Add the hover glow override to the MUI theme

**Files:**
- Modify: `src/theme.ts`
- Create: `src/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/theme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { theme } from "./theme";

type StyleFn = (props: {
  ownerState: { variant?: string; color?: string };
  theme: typeof theme;
}) => Record<string, unknown>;

const rootOverride = theme.components?.MuiButton?.styleOverrides
  ?.root as StyleFn;

describe("MuiButton theme override — contained primary glow", () => {
  it("adds position:relative to contained primary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "primary" },
      theme,
    });
    expect(styles).toHaveProperty("position", "relative");
  });

  it("includes ::before and ::after inside &:hover for contained primary", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "primary" },
      theme,
    }) as Record<string, Record<string, unknown>>;
    expect(styles["&:hover"]).toBeDefined();
    expect(styles["&:hover"]["&::before"]).toBeDefined();
    expect(styles["&:hover"]["&::after"]).toBeDefined();
  });

  it("does NOT add position:relative to contained secondary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "secondary" },
      theme,
    });
    expect(styles).not.toHaveProperty("position");
  });

  it("does NOT add position:relative to outlined primary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "outlined", color: "primary" },
      theme,
    });
    expect(styles).not.toHaveProperty("position");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/theme.test.ts`  
Expected: FAIL — `styles` does not have property `position`

- [ ] **Step 3: Add the glow override to `src/theme.ts`**

Inside the `MuiButton.styleOverrides.root` callback, the current `return` statement returns an object with only `"&.Mui-disabled"`. Extend it to also spread the glow styles:

```ts
return {
  "&.Mui-disabled": {
    opacity: 0.45,
    pointerEvents: "none",
    ...(ownerState.variant === "contained" && pc?.main
      ? {
          backgroundColor: pc.main,
          color: pc.contrastText ?? "inherit",
          boxShadow: "none",
        }
      : {}),
    ...(ownerState.variant === "outlined" && pc?.main
      ? { color: pc.main, borderColor: pc.main }
      : {}),
    ...(ownerState.variant === "text" && pc?.main
      ? { color: pc.main }
      : {}),
  },
  ...(ownerState.variant === "contained" &&
    ownerState.color === "primary" && {
      position: "relative",
      "&:hover": {
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background:
            "linear-gradient(var(--rotation), #7ad884 0%, transparent 50%)",
          animation: "spin 2s linear infinite",
          zIndex: 0,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: "2px",
          borderRadius: "inherit",
          background: t.palette.primary.main,
          zIndex: 1,
        },
        "& .MuiButton-icon, & .MuiTouchRipple-root": {
          zIndex: 2,
          position: "relative",
        },
      },
    }),
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/theme.test.ts`  
Expected: PASS — all 4 tests green

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `npm run test`  
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/theme.ts src/theme.test.ts
git commit -m "feat: add rotating glow border to contained primary buttons on hover"
```

---

### Task 3: Open PR

- [ ] **Step 1: Push the feature branch**

```bash
git push -u origin feat/rotating-glow-button
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create \
  --title "feat: rotating glow border on primary buttons" \
  --body "$(cat <<'EOF'
## Summary
- Adds a rotating 2px glowing border to `contained primary` buttons on hover
- Uses `@property --rotation` (typed `<angle>`) + `@keyframes spin` in global CSS
- Theme override injects `::before` (gradient sweep) + `::after` (interior cover) pseudo-elements on hover only
- Resting button state is unchanged

## Test plan
- [ ] All Vitest tests pass (`npm run test`)
- [ ] Visually verify the glow border appears on hover for primary contained buttons on HomePage
- [ ] Verify non-primary and non-contained buttons are unaffected
- [ ] Verify MUI ripple effect still shows on click

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
