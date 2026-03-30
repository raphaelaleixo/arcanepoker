# Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the two background SVG elements between their home page positions and their ArcanaDisplayCard positions when navigating to/from the game and tutorial pages, using the CSS View Transitions API.

**Architecture:** Convert CSS pseudo-element backgrounds in `HomePage` and `ArcanaDisplayCard` to real DOM nodes with `view-transition-name` attributes. A new `useNavigateWithTransition` hook wraps React Router's `navigate` with `document.startViewTransition`, falling back gracefully when unsupported. CSS overrides control timing and easing.

**Tech Stack:** React 18, React Router 6, CSS View Transitions API (native browser), MUI v5, TypeScript 5.9, Vitest + @testing-library/react 15

---

### Task 1: TypeScript type augmentation for `viewTransitionName`

`@types/react` 18.3.x does not include `viewTransitionName` in its `CSSProperties`. Without this augmentation, `style={{ viewTransitionName: 'bg-top' }}` will cause a TS error.

**Files:**
- Create: `src/types/css-view-transitions.d.ts`

- [ ] **Step 1: Create the type augmentation file**

```ts
// src/types/css-view-transitions.d.ts
import 'react';

declare module 'react' {
  interface CSSProperties {
    viewTransitionName?: string;
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/css-view-transitions.d.ts
git commit -m "chore: augment React CSSProperties with viewTransitionName"
```

---

### Task 2: Create `useNavigateWithTransition` hook

This hook wraps `useNavigate` from React Router. When called, it fires `document.startViewTransition` (if supported) before performing the route change. If the browser doesn't support View Transitions (Firefox < 131, Safari < 18.2), it falls back to a plain `navigate(to)`.

**Files:**
- Create: `src/hooks/useNavigateWithTransition.ts`
- Create: `src/hooks/useNavigateWithTransition.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/useNavigateWithTransition.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigateWithTransition } from './useNavigateWithTransition';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useNavigateWithTransition', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    expect(typeof result.current).toBe('function');
  });

  it('calls navigate directly when startViewTransition is not available', () => {
    // jsdom does not implement startViewTransition, so this always exercises the fallback path
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    // calling it must not throw
    expect(() => result.current('/game')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npm run test -- src/hooks/useNavigateWithTransition.test.ts
```

Expected: FAIL — `useNavigateWithTransition` does not exist yet.

- [ ] **Step 3: Implement the hook**

```ts
// src/hooks/useNavigateWithTransition.ts
import { useNavigate } from 'react-router-dom';

export function useNavigateWithTransition(): (to: string) => void {
  const navigate = useNavigate();

  return (to: string) => {
    if (!document.startViewTransition) {
      navigate(to);
      return;
    }
    document.startViewTransition(() => {
      navigate(to);
    });
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/hooks/useNavigateWithTransition.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNavigateWithTransition.ts src/hooks/useNavigateWithTransition.test.ts
git commit -m "feat: add useNavigateWithTransition hook with fallback"
```

---

### Task 3: Update HomePage — real background elements + transition names + navigation

Replace the `Stack`'s `::before`/`::after` pseudo-elements (which render `background.svg`) with two real `<Box>` components that can receive `viewTransitionName`. Also assign `viewTransitionName` to the outer box (title/buttons/border) and credits box so they fade out during the transition. Swap the "start new game" and "tutorial" buttons from `<Link>`-based navigation to `useNavigateWithTransition`.

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HomePage.test.tsx`

- [ ] **Step 1: Update the failing tests first**

The existing test `"has a Play link pointing to /game"` checks for a `<a href="/game">` element. After this change, "start new game" and "tutorial" become `<button>` elements. Update the test file:

```tsx
// src/pages/HomePage.test.tsx
import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme";
import { HomePage } from "./HomePage";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  it("renders the game title", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Arcane Poker")).toBeInTheDocument();
  });

  it("has a start new game button", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("button", { name: /start new game/i })
    ).toBeInTheDocument();
  });

  it("has a tutorial button", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("button", { name: /tutorial/i })
    ).toBeInTheDocument();
  });

  it("has a Rules link pointing to /rules", () => {
    renderWithProviders(<HomePage />);
    const rulesLink = screen.getByRole("link", { name: /learn to play/i });
    expect(rulesLink).toHaveAttribute("href", "/rules");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/pages/HomePage.test.tsx
```

Expected: "has a start new game button" and "has a tutorial button" FAIL (elements don't exist yet as buttons). "has a Play link pointing to /game" passes (link still exists). "renders the game title" passes.

- [ ] **Step 3: Rewrite HomePage.tsx**

Replace the full file content:

```tsx
// src/pages/HomePage.tsx
import {
  Box,
  Button,
  Link as HtmlLink,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { ElementType } from "react";
import backgroundUrl from "../assets/background.svg?url";
import { useNavigateWithTransition } from "../hooks/useNavigateWithTransition";

const LudoratorySvg = () => (
  <svg
    width="39"
    height="49"
    viewBox="0 0 39 49"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.3849 16.8356C38.0465 16.4765 37.2161 15.8751 36.5393 15.4977L28.6391 11.0933C27.9624 10.7158 27.4081 9.78967 27.4081 9.03433V2.79442H29.4033C30.1846 2.79442 30.8243 2.17714 30.8243 1.42279V1.37263C30.8243 0.617783 30.1846 0 29.4033 0H26.035C26.0262 0 26.0185 0.00148983 26.0108 0.00148983C26.003 0.00148983 25.9953 0 25.9871 0H25.9352C25.1536 0 24.5138 0.617783 24.5138 1.37263V7.42034C24.5138 8.17569 24.5138 9.41026 24.5138 10.1656V10.6488C24.5138 11.4032 25.0677 12.3293 25.7449 12.7068L33.644 17.1112C34.3212 17.4886 35.1518 18.0905 35.4902 18.4496C35.8286 18.8081 36.1057 20.4737 36.1057 21.2276V34.2556C36.1057 35.0105 35.9808 36.0057 35.8286 36.468C35.6764 36.9304 34.3212 37.9951 33.644 38.3725L21.961 44.8866C21.2842 45.264 20.3293 45.6568 19.8382 45.7606C19.3475 45.8644 17.7157 45.264 17.0385 44.8866L5.35551 38.3725C4.67823 37.9951 3.84821 37.3927 3.50931 37.0342C3.17094 36.6756 2.89426 35.0105 2.89426 34.2556V21.2276C2.89426 20.4737 3.01871 19.4775 3.17145 19.0152C3.32315 18.5528 4.67823 17.4881 5.35602 17.1112L13.1379 12.7723C13.8146 12.3944 14.3679 11.4682 14.3679 10.7144V10.2312C14.3679 9.47631 14.3679 8.24174 14.3679 7.48639V1.62987C14.3787 1.56233 14.386 1.49331 14.386 1.42328V1.37263C14.386 0.617783 13.7472 0 12.965 0H12.9471H12.8945H9.5961C8.81443 0 8.1752 0.617783 8.1752 1.37263V1.42328C8.1752 2.17763 8.81443 2.79492 9.5961 2.79492H11.4732V9.10038C11.4732 9.85522 10.9193 10.7819 10.242 11.1593L2.46125 15.4977C1.78449 15.8751 0.953953 16.4765 0.61557 16.8356C0.276672 17.1941 0 18.8598 0 19.6141V35.8686C0 36.6235 0.124451 37.6192 0.276672 38.082C0.428893 38.5439 1.78449 39.6091 2.46125 39.986L17.039 48.1131C17.7157 48.4905 18.6712 48.8853 19.1618 48.9881C19.653 49.0919 21.2842 48.4905 21.9615 48.1131L36.5398 39.986C37.2161 39.6086 38.0471 39.0062 38.3854 38.6477C38.7238 38.2896 39.0005 36.6235 39.0005 35.8686V19.6141C39 18.8598 38.7233 17.1941 38.3849 16.8356ZM18.2691 27.0076L6.26987 20.3178C5.5931 19.9404 5.03873 20.2493 5.03873 21.0036V34.3838C5.03873 35.1381 5.5931 36.0638 6.26987 36.4422L18.2691 43.1326C18.9459 43.51 20.0536 43.51 20.7303 43.1326L32.7301 36.4422C33.4059 36.0643 33.9608 35.1386 33.9608 34.3838V21.0036C33.9608 20.2493 33.4064 19.9404 32.7301 20.3178L20.7309 27.0076C20.0536 27.3851 18.9464 27.3851 18.2691 27.0076ZM8.68844 35.1039C7.97773 34.7091 7.40124 33.7585 7.40124 32.9823C7.40124 32.2056 7.97773 31.8968 8.68844 32.2926C9.39966 32.6879 9.97615 33.6379 9.97615 34.4151C9.97615 35.1913 9.39966 35.4997 8.68844 35.1039ZM15.7704 31.3108C15.0591 30.915 14.4826 29.9659 14.4826 29.1892C14.4826 28.4125 15.0591 28.1036 15.7704 28.499C16.481 28.8947 17.0575 29.8448 17.0575 30.6215C17.0575 31.3977 16.481 31.7061 15.7704 31.3108ZM29.8441 32.2921C30.5548 31.8963 31.1318 32.2052 31.1318 32.9818C31.1318 33.758 30.5548 34.7086 29.8441 35.1034C29.1334 35.4997 28.5569 35.1913 28.5569 34.4146C28.5569 33.6379 29.1334 32.6879 29.8441 32.2921ZM26.3034 30.3965C27.0141 30.0007 27.5906 30.3096 27.5906 31.0848C27.5906 31.8615 27.0141 32.8115 26.3034 33.2073C25.5922 33.6031 25.0157 33.2942 25.0157 32.5175C25.0162 31.7413 25.5927 30.7908 26.3034 30.3965ZM22.7628 28.499C23.474 28.1036 24.051 28.4125 24.051 29.1892C24.051 29.9654 23.474 30.915 22.7628 31.3108C22.052 31.7061 21.475 31.3977 21.475 30.622C21.475 29.8448 22.052 28.8947 22.7628 28.499ZM17.868 20.4737C18.6569 20.9142 19.924 20.9222 20.6974 20.4911C21.4714 20.0596 21.4585 19.3524 20.6697 18.9119C19.8802 18.4699 18.6132 18.4625 17.8397 18.894C17.0658 19.3246 17.0786 20.0327 17.868 20.4737Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

const bgBoxStyles = {
  display: "block",
  width: "15em",
  aspectRatio: "69/56",
  backgroundSize: "cover",
  backgroundPosition: "center",
  pointerEvents: "none" as const,
} as const;

export function HomePage() {
  const navigateWithTransition = useNavigateWithTransition();

  return (
    <>
      <Box
        style={{ viewTransitionName: "home-ui" }}
        sx={{
          position: "relative",
          "&:before": {
            content: "''",
            position: "absolute",
            inset: "1.25em -3em",
            border: "1px solid",
            borderColor: "darkSuit.main",
            borderRadius: 3,
            opacity: 1,
            transition: "all 0.3s ease-in-out",
          },
          "&:after": {
            content: "''",
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: "100%",
            width: "40%",
            background: "#242424",
          },
        }}
      >
        <Stack
          sx={{
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            style={{ viewTransitionName: "bg-top" }}
            sx={{
              ...bgBoxStyles,
              backgroundImage: `url(${backgroundUrl})`,
            }}
          />
          <Stack sx={{ pt: 3, pb: 2 }} spacing={1} useFlexGap>
            <Typography
              variant="h1"
              sx={{
                textAlign: "center",
                textBox: "trim-both ex alphabetic",
              }}
            >
              Arcane Poker
            </Typography>
            <Stack
              direction="column"
              gap={1}
              sx={{ justifyContent: "center", mt: 1 }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={() => navigateWithTransition("/game")}
              >
                start new game
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigateWithTransition("/tutorial")}
              >
                tutorial
              </Button>
              <Button
                variant="outlined"
                component={Link as ElementType}
                size="small"
                to="/rules"
              >
                learn to play
              </Button>
            </Stack>
          </Stack>
          <Box
            style={{ viewTransitionName: "bg-bottom" }}
            sx={{
              ...bgBoxStyles,
              backgroundImage: `url(${backgroundUrl})`,
              transform: "rotate(180deg)",
            }}
          />
        </Stack>
      </Box>
      <Box
        style={{ viewTransitionName: "home-credits" }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          mt: 1,
          svg: {
            height: "1.5em",
            width: "auto",
          },
        }}
      >
        <LudoratorySvg />
        <Box>
          <Typography
            variant="caption"
            fontWeight={400}
            component="div"
            lineHeight={1.2}
            fontSize="0.65em"
          >
            Arcane Poker by{" "}
            <HtmlLink
              href="https://aleixo.me"
              target="_blank"
              rel="noopener noreferrer"
            >
              Raphael Aleixo / Ludoratory
            </HtmlLink>
            .
          </Typography>
          <Typography
            variant="caption"
            fontWeight={400}
            lineHeight={1.2}
            fontSize="0.65em"
            component="div"
          >
            Licensed under{" "}
            <HtmlLink
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC-SA 4.0
            </HtmlLink>
            .
          </Typography>
        </Box>
      </Box>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- src/pages/HomePage.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.test.tsx
git commit -m "feat: convert home page backgrounds to real DOM nodes with view-transition names"
```

---

### Task 4: Update ArcanaDisplayCard — real background elements

Replace the `::before`/`::after` pseudo-elements (which render `background-table.svg`) with two real `<Box>` components that receive `viewTransitionName`. These share the same names (`bg-top`, `bg-bottom`) as the home page elements — safe because `HomePage` and `ArcanaDisplayCard` are never mounted simultaneously.

**Files:**
- Modify: `src/components/Table/ArcanaDisplayCard.tsx`

- [ ] **Step 1: Run existing tests to capture baseline**

```bash
npm run test
```

Expected: all tests pass. Note the count so you can confirm nothing regresses.

- [ ] **Step 2: Update ArcanaDisplayCard.tsx**

Replace only the return statement's outer Box and its `sx` `::before`/`::after` rules. The rest of the component (state, handlers, `cardContent` JSX) is unchanged. The full new return block:

```tsx
  return (
    <Box
      sx={{
        display: "grid",
        width: "100%",
        gridRow: "2 / 4",
        gridColumn: "2",
        position: "relative",
        zIndex: 0,
      }}
    >
      <Box
        style={{ viewTransitionName: "bg-top" }}
        sx={{
          display: "block",
          position: "absolute",
          width: "160%",
          maxWidth: "10em",
          aspectRatio: "69/57",
          backgroundImage: `url(${backgroundTableUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
      <Box
        style={{ viewTransitionName: "bg-bottom" }}
        sx={{
          display: "block",
          position: "absolute",
          width: "160%",
          maxWidth: "10em",
          aspectRatio: "69/57",
          backgroundImage: `url(${backgroundTableUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) rotate(180deg)",
          opacity: 0.3,
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
      {cardContent}
    </Box>
  );
```

- [ ] **Step 3: Run all tests to confirm nothing regressed**

```bash
npm run test
```

Expected: same pass count as Step 1. No new failures.

- [ ] **Step 4: Commit**

```bash
git add src/components/Table/ArcanaDisplayCard.tsx
git commit -m "feat: convert ArcanaDisplayCard backgrounds to real DOM nodes with view-transition names"
```

---

### Task 5: CSS view-transition timing overrides

Add `::view-transition-*` rules to control the morph duration/easing for the background elements, and make the home UI/credits fade out quickly. Without these overrides, the browser defaults to a 250ms cross-fade for everything.

The SVG cross-fade between `background.svg` (home) and `background-table.svg` (game) happens automatically via the default `::view-transition-old`/`::view-transition-new` behaviour within the morphing `bg-top`/`bg-bottom` containers.

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add rules to the end of `src/index.css`**

Append after the existing `@property --posy` block:

```css
/* ─── View Transitions ─────────────────────────────────────────── */

/* Background blobs: morph position/size over 500ms with Material easing */
::view-transition-group(bg-top),
::view-transition-group(bg-bottom) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Home UI: fade out fast, do not fade in (it's absent on the game page) */
::view-transition-old(home-ui),
::view-transition-old(home-credits) {
  animation: vt-fade-out 200ms ease forwards;
}
::view-transition-new(home-ui),
::view-transition-new(home-credits) {
  animation: none;
  opacity: 0;
}

@keyframes vt-fade-out {
  to { opacity: 0; }
}
```

- [ ] **Step 2: Run all tests to confirm no regressions**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 3: Manually verify the transition in the browser**

```bash
npm run dev
```

Open http://localhost:5173. Click "start new game":

- The title, buttons, border decoration, and credits should fade out (~200ms).
- The two background SVG elements should shrink and converge to the center of the game table while cross-fading from the home SVG to the game SVG (~500ms).
- The game UI should appear once the transition completes.

Click the browser Back button (or add a temporary `<button onClick={() => navigate(-1)}>back</button>` in `PokerTable`):
- The reverse: backgrounds expand outward from the table center back to the home page positions.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: add view-transition CSS rules for page transition animations"
```

---

### Task 6: Open pull request

- [ ] **Step 1: Push the branch and open PR**

```bash
git push -u origin HEAD
gh pr create \
  --title "feat: animated page transitions via View Transitions API" \
  --body "$(cat <<'EOF'
## Summary

- Converts pseudo-element background images in \`HomePage\` and \`ArcanaDisplayCard\` to real DOM nodes so they can receive \`view-transition-name\`
- Adds \`useNavigateWithTransition\` hook that wraps React Router's \`navigate\` with \`document.startViewTransition\`, with graceful fallback for unsupported browsers
- The two background SVGs morph between their home page positions (large, top/bottom of screen) and their game table positions (small, centered in the ArcanaDisplayCard area) with an SVG cross-fade
- Transition is bidirectional — browser back navigation reverses it automatically
- No new dependencies

## Test plan
- [ ] All existing tests pass
- [ ] New hook tests pass
- [ ] Updated HomePage tests pass (buttons instead of links for game/tutorial nav)
- [ ] Manual: home → game transition fires with morphing backgrounds
- [ ] Manual: browser back from game → home reverses the transition
- [ ] Manual: \`/rules\` navigation has no special transition (plain instant)
- [ ] Manual: Firefox / older Safari fall back to instant navigation without errors
EOF
)" \
  --base main
```
