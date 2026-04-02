# Rotating Glow Border — Primary Button Effect

**Date:** 2026-04-01  
**Status:** Approved

## Summary

Add a rotating glowing border to `contained` primary buttons on hover, using a sweeping `linear-gradient` driven by a CSS custom property (`--rotation`) animated via `@keyframes`. The effect is ~2px wide and only activates on hover.

---

## Changes

### 1. `src/index.css`

Register `--rotation` as a typed `<angle>` CSS custom property so it can be animated:

```css
@property --rotation {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
```

### 2. `src/theme.ts`

Inside the existing `MuiButton.styleOverrides.root` callback, add a conditional block for `variant === 'contained'`:

```ts
...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
  position: 'relative',
  '&:hover': {
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      background: 'linear-gradient(var(--rotation), #7ad884 0%, transparent 50%)',
      animation: 'spin 2s linear infinite',
      zIndex: 0,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '2px',
      borderRadius: 'inherit',
      background: t.palette.primary.main,
      zIndex: 1,
    },
    '& .MuiButton-icon, & .MuiTouchRipple-root': {
      zIndex: 2,
      position: 'relative',
    },
  },
  '@keyframes spin': {
    to: { '--rotation': '360deg' },
  },
})
```

**Note:** `::after` background uses `t.palette.primary.main` (not hardcoded) so it respects any future theme changes.

---

## Constraints

- Effect applies to `contained primary` buttons only (`variant === 'contained' && color === 'primary'`)
- Resting state is unchanged — no modifications to default MUI contained button style
- 2px border achieved via `::after` cover with `inset: 2px`
- Button label and ripple are promoted to `z-index: 2` to remain visible above `::after`

---

## Browser Support

`@property` is supported in all modern browsers (Chrome 85+, Firefox 128+, Safari 16.4+). No polyfill needed for this project's target audience.
