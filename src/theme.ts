import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    gold: { light: string; main: string; dark: string };
    silver: { light: string; main: string; dark: string };
    redSuit: { main: string };
    blackSuit: { main: string };
  }
  interface PaletteOptions {
    gold?: { light?: string; main?: string; dark?: string };
    silver?: { light?: string; main?: string; dark?: string };
    redSuit?: { main?: string };
    blackSuit?: { main?: string };
  }
}

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0A2F1A", paper: "#0F3D20" },
    primary: { main: "#2E7D32" },
    secondary: { main: "#9B59B6", dark: "#6C3483" },
    gold: { light: "#FFF8DC", main: "#FFD700", dark: "#B8860B" },
    silver: { light: "#F5F5F5", main: "#C0C0C0", dark: "#808080" },
    redSuit: { main: "#C62828" },
    blackSuit: { main: "#1A1A1A" },
  },
  typography: { fontFamily: '"Georgia", "Times New Roman", serif' },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});
