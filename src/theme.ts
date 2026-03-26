import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
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
    h1: {
      fontFamily: ["Young Serif"].join(","),
      fontSize: "2em",
    },
    h3: {
      fontFamily: ["Young Serif"].join(","),
      fontSize: "1.75em",
    },
    h5: {
      fontFamily: ["Young Serif"].join(","),
      fontSize: "1.25em",
    },
    subtitle1: {
      fontSize: "1.5em",
      fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
      textBox: "trim-both cap alphabetic",
    },
  },
});

theme = createTheme(theme, {
  palette: {
    redSuit: theme.palette.augmentColor({
      color: {
        main: "#e11d48",
      },
      name: "redSuit",
    }),
    blackSuit: theme.palette.augmentColor({
      color: {
        main: "#0f172a",
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
