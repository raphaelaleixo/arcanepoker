# Arcana Reveal Animation — Glow Burst + Scale Pop

## Context

The `ArcanaDisplay` component shows the active Major Arcana's name and effect text. Currently, the reveal transition is a simple 300ms opacity fade — easy to miss during gameplay. We need a more attention-grabbing animation when the arcana transitions from pending ("An arcana stirs...") to revealed.

## Design

### Animation Keyframes

Add two `@emotion/react` keyframes to `ArcanaDisplay.tsx`:

**`revealGlow`** — expanding box-shadow burst using `primary.main` (#7ad884):
- 0%: `box-shadow: 0 0 0 0 rgba(122, 216, 132, 0.6)`
- 50%: `box-shadow: 0 0 20px 8px rgba(122, 216, 132, 0.3)`
- 100%: `box-shadow: 0 0 0 0 rgba(122, 216, 132, 0)`
- Duration: 500ms ease-out

**`revealPop`** — springy scale bounce:
- 0%: `transform: scale(0.92)`
- 50%: `transform: scale(1.06)`
- 100%: `transform: scale(1)`
- Duration: 400ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (matches project convention)

### Application

Apply both animations to the **revealed text Box** (the `gridArea: "1 / 1"` container that shows name + effect, around line 120).

Condition: `arcanaCardToShow && !pendingArcanaCard`

### Re-trigger Mechanism

Use `key={arcanaCardToShow?.value}` on the revealed text Box so React remounts it each time a new arcana is revealed, replaying the animation.

### Rounded Corners

Add `borderRadius: 1` to the revealed text Box so the glow burst has soft edges.

## Files Modified

- `src/components/Table/ArcanaDisplay.tsx` — add keyframes + apply to revealed text container

No new files. No changes to protected Card components.

## Verification

1. Run `npm run dev` and start a game
2. Trigger an arcana reveal — observe the lime-green glow burst expanding outward and the text popping in with a springy bounce
3. Trigger multiple arcana reveals — confirm the animation replays each time (not just the first)
4. Check that the pending state ("An arcana stirs...") is unaffected
5. Check that the animation doesn't cause layout shift (the container height stays at 7em)
6. Run `npm run build` to confirm no TypeScript errors
