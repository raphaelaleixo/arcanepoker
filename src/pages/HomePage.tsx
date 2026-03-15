import type { ElementType } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at center, #0F3D20 0%, #0A2F1A 70%, #061a0f 100%)",
        gap: 4,
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          color: "gold.main",
          textShadow: "0 0 20px rgba(255,215,0,0.5)",
          letterSpacing: "0.1em",
          textAlign: "center",
        }}
      >
        Arcane Poker
      </Typography>
      <Typography
        variant="h6"
        sx={{
          color: "silver.light",
          opacity: 0.7,
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        Where the Major Arcana shape your fate
      </Typography>
      <Stack direction="row" spacing={2} mt={2}>
        <Button
          component={Link as ElementType}
          to="/game"
          variant="contained"
          size="large"
          sx={{
            px: 6,
            py: 1.5,
            fontSize: "1.2rem",
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            border: "2px solid",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              background: "linear-gradient(135deg, #388E3C, #2E7D32)",
              borderColor: "gold.main",
            },
          }}
        >
          Play
        </Button>
        <Button
          component={Link as ElementType}
          to="/rules"
          variant="outlined"
          size="large"
          sx={{
            px: 6,
            py: 1.5,
            fontSize: "1.2rem",
            borderColor: "gold.dark",
            color: "gold.light",
            "&:hover": {
              borderColor: "gold.main",
              background: "rgba(255,215,0,0.05)",
            },
          }}
        >
          Rules
        </Button>
      </Stack>
    </Box>
  );
}
