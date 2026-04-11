import { createTheme, type Theme } from "@mui/material/styles";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                   */
/* ------------------------------------------------------------------ */

export const HEADING_FONT = '"Young Serif", Georgia, serif';

/** Translucent gold-bordered paper used by all arcane modals. */
export const ARCANE_PAPER_SX = {
  backgroundColor: "rgba(0,0,0,0.8)",
  border: "1px solid",
  borderColor: "gold.dark",
  borderRadius: 2,
  overflow: "hidden",
} as const;

/** Gold divider colour shared across modals. */
export const GOLD_DIVIDER_SX = {
  borderColor: "rgba(255,215,0,0.2)",
} as const;

/** Dark panel paper used by menus and settings dialog. */
export const ARCANE_MENU_PAPER_SX = {
  bgcolor: "blackSuit.main",
  border: 1,
  borderColor: "blackSuit.light",
  color: "#fff",
} as const;

/** MenuList item styling used by NavFab and HomePage menus. */
export const ARCANE_MENU_LIST_SX = {
  "& .MuiMenuItem-root": {
    fontFamily: HEADING_FONT,
    fontSize: "0.875em",
  },
  "& .MuiMenuItem-root:hover": {
    bgcolor: "transparent",
    color: "secondary.main",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Custom typography variant types                                    */
/* ------------------------------------------------------------------ */

declare module "@mui/material/styles" {
  interface TypographyVariants {
    cardTitle: React.CSSProperties;
    cardTags: React.CSSProperties;
    cardDesc: React.CSSProperties;
    cardEffect: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    cardTitle?: React.CSSProperties;
    cardTags?: React.CSSProperties;
    cardDesc?: React.CSSProperties;
    cardEffect?: React.CSSProperties;
  }

  interface Palette {
    gold: { light: string; main: string; dark: string };
    silver: { light: string; main: string; dark: string };
    redSuit: { main: string };
    blackSuit: { main: string };
    rose: { light: string; main: string; dark: string };
  }
  interface PaletteOptions {
    gold?: { light?: string; main?: string; dark?: string };
    silver?: { light?: string; main?: string; dark?: string };
    redSuit?: { main?: string };
    blackSuit?: { main?: string };
    rose?: { light?: string; main?: string; dark?: string };
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    cardTitle: true;
    cardTags: true;
    cardDesc: true;
    cardEffect: true;
  }
}

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

let theme = createTheme({
  palette: {
    text: {
      secondary: "#ffffff",
    },
    primary: {
      main: "#7ad884",
    },
    secondary: {
      main: "#84cc16",
    },
    error: {
      main: "#ef4444",
    },
    success: {
      main: "#22c55e",
    },
    warning: {
      main: "#f59e0b",
    },
    tonalOffset: 0.2,
  },
  typography: {
    fontFamily: ["Rubik"].join(","),
    allVariants: {
      textWrap: "balance",
    },
    h1: {
      fontFamily: HEADING_FONT,
      fontSize: "2em",
    },
    h3: {
      fontFamily: HEADING_FONT,
      fontSize: "1.75em",
    },
    h5: {
      fontFamily: HEADING_FONT,
      fontSize: "1.25em",
    },
    subtitle1: {
      fontSize: "1.5em",
      fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
      textBox: "trim-both cap alphabetic",
    },
    cardTitle: {
      fontFamily: HEADING_FONT,
      fontWeight: "bold",
      fontSize: "0.875rem",
    },
    cardTags: {
      fontFamily: "Rubik",
      fontSize: "0.6rem",
      fontWeight: 600,
      textTransform: "uppercase",
    },
    cardDesc: {
      fontFamily: "Rubik",
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
    cardEffect: {
      fontSize: "0.65rem",
      fontStyle: "italic",
    },
  },
});

theme = createTheme(theme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({
          ownerState,
          theme: t,
        }: {
          ownerState: { variant?: string; color?: string };
          theme: Theme;
        }) => {
          const palette = t.palette as unknown as Record<
            string,
            { main?: string; contrastText?: string } | undefined
          >;
          const pc = ownerState.color ? palette[ownerState.color] : undefined;
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
          };
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        placement: "top" as const,
        enterDelay: 1000,
        disableInteractive: false,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: theme.palette.augmentColor({
            color: { main: "#242424" },
            name: "blackSuit",
          }).dark,
          border: `1px solid ${theme.palette.augmentColor({
            color: { main: "#242424" },
            name: "blackSuit",
          }).light}`,
          padding: 12,
        },
        arrow: {
          color: theme.palette.augmentColor({
            color: { main: "#242424" },
            name: "blackSuit",
          }).dark,
          "&::before": {
            border: `1px solid ${theme.palette.augmentColor({
              color: { main: "#242424" },
              name: "blackSuit",
            }).light}`,
          },
        },
      },
    },
  },
  palette: {
    redSuit: theme.palette.augmentColor({
      color: {
        main: "#e11d48",
      },
      name: "redSuit",
    }),
    blackSuit: theme.palette.augmentColor({
      color: {
        main: "#242424",
      },
      name: "blackSuit",
    }),
    blueSuit: theme.palette.augmentColor({
      color: {
        main: "#8b5cf6",
      },
      name: "blueSuit",
    }),
    gold: theme.palette.augmentColor({
      color: {
        main: "#E7BF9C",
      },
      name: "gold",
    }),
    silver: theme.palette.augmentColor({
      color: {
        main: "#CCCCCC",
      },
      name: "silver",
    }),
    rose: theme.palette.augmentColor({
      color: {
        main: "#ff5581",
      },
      name: "rose",
    }),
  },
});

export { theme };
