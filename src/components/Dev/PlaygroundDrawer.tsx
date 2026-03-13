import {
  Box,
  Button,
  Chip,
  Drawer,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useGame } from "../../store/useGame";
import tarot from "../../data/tarot";
import type { ArcanaValue } from "../../types/types";

interface PlaygroundDrawerProps {
  open: boolean;
  onClose: () => void;
}

const VALID_STAGES = ["pre-flop", "flop", "turn", "river"] as const;

const ARCANA_LIST = Array.from({ length: 22 }, (_, i) => {
  const value = String(i) as ArcanaValue;
  const data = (tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>)[value];
  return {
    value,
    fullName: data?.fullName ?? `Arcana ${i}`,
    gameEffect: data?.gameEffect ?? null,
  };
});

export function PlaygroundDrawer({ open, onClose }: PlaygroundDrawerProps) {
  const { state, dispatch } = useGame();
  const isValidStage = VALID_STAGES.includes(state.stage as typeof VALID_STAGES[number]);

  function handleForce(value: ArcanaValue) {
    dispatch({ type: "FORCE_ARCANA", payload: { value } });
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          background: "#0F1A2E",
          borderLeft: "1px solid",
          borderColor: "secondary.dark",
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "rgba(155,89,182,0.2)" }}>
        <Typography
          variant="subtitle1"
          sx={{ color: "secondary.light", fontWeight: "bold" }}
        >
          ⚗ Arcana Playground
        </Typography>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          Dev tool — force any arcana immediately
        </Typography>
      </Box>

      {!isValidStage && (
        <Typography
          variant="caption"
          sx={{ color: "silver.dark", px: 2, py: 1, display: "block" }}
        >
          Start a hand to force arcana
        </Typography>
      )}

      <List dense sx={{ overflowY: "auto", flex: 1 }}>
        {ARCANA_LIST.map(({ value, fullName, gameEffect }) => {
          const isActive = state.activeArcana?.card.value === value;
          return (
            <ListItem
              key={value}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                py: 1,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "silver.light", fontWeight: "bold", fontSize: "0.75rem" }}
                  >
                    {value}. {fullName}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="Active"
                      size="small"
                      color="secondary"
                      sx={{ height: 16, fontSize: "0.6rem" }}
                    />
                  )}
                </Box>
                {gameEffect && (
                  <Typography
                    variant="caption"
                    sx={{ color: "silver.dark", display: "block", fontSize: "0.65rem" }}
                  >
                    {gameEffect}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                disabled={!isValidStage}
                onClick={() => handleForce(value)}
                sx={{
                  minWidth: 52,
                  flexShrink: 0,
                  fontSize: "0.65rem",
                  py: 0.25,
                  px: 0.75,
                  color: "secondary.light",
                  borderColor: "secondary.dark",
                  "&:hover": { borderColor: "secondary.main" },
                }}
              >
                Force
              </Button>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
