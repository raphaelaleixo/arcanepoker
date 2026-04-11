import {
  Box,
  Button,
  Chip,
  Drawer,
  Link,
  List,
  Switch,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useState, useEffect } from "react";
import { useGame } from "../../store/useGame";
import { useSettings } from "../../store/SettingsContext";
import tarot from "../../data/tarot";
import type { ArcanaValue } from "../../types/types";

interface PlaygroundDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenTarot: () => void;
  onOpenGameOver: () => void;
}

const VALID_STAGES = ["pre-flop", "flop", "turn", "river"] as const;

const ARCANA_LIST = Array.from({ length: 22 }, (_, i) => {
  const value = String(i) as ArcanaValue;
  const data = (
    tarot.arcana as Record<string, { fullName: string; gameEffect?: string }>
  )[value];
  return {
    value,
    fullName: data?.fullName ?? `Arcana ${i}`,
    gameEffect: data?.gameEffect ?? null,
  };
});

export function PlaygroundDrawer({
  open,
  onClose,
  onOpenTarot,
  onOpenGameOver,
}: PlaygroundDrawerProps) {
  const { state, dispatch } = useGame();
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useSettings();
  const isValidStage = VALID_STAGES.includes(
    state.stage as (typeof VALID_STAGES)[number],
  );
  const remainingValues = new Set(state.arcanaDeck.map((c) => c.value));
  const dealtValues = new Set(
    ARCANA_LIST.map((a) => a.value).filter((v) => !remainingValues.has(v)),
  );

  const [stackInputs, setStackInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const inputs: Record<string, string> = {};
      state.players.forEach((p) => {
        inputs[p.id] = String(p.stack);
      });
      setStackInputs(inputs);
    }
  }, [open]);

  function handleForce(value: ArcanaValue) {
    dispatch({ type: "FORCE_ARCANA", payload: { value } });
    onClose();
  }

  function handleStackChange(playerId: string, raw: string) {
    setStackInputs((prev) => ({ ...prev, [playerId]: raw }));
  }

  function handleStackBlur(playerId: string) {
    const val = parseInt(stackInputs[playerId] ?? "0", 10);
    if (!isNaN(val) && val >= 0) {
      dispatch({ type: "SET_PLAYER_STACK", payload: { playerId, stack: val } });
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 300,
          backgroundColor: "blackSuit.dark",
          borderLeft: "1px solid",
          borderColor: "silver.dark",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "rgba(155,89,182,0.2)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: "gold.light",
            fontWeight: "bold",
            fontFamily: "Young Serif, serif",
          }}
        >
          Playground
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "silver.dark",
            lineHeight: 1.2,
            display: "block",
            mt: 1,
          }}
        >
          Dev tool — Use this drawer to preview modals, force arcana, and adjust
          player stacks for testing purposes. Changes made here will affect the
          current game state.
        </Typography>
      </Box>

      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(155,89,182,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "silver.dark", display: "block", mb: 1 }}
          >
            Audio
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant={musicEnabled ? "contained" : "outlined"}
              onClick={toggleMusic}
              sx={{ fontSize: "0.65rem", py: 0.25, px: 0.75 }}
            >
              Music {musicEnabled ? "On" : "Off"}
            </Button>
            <Button
              size="small"
              variant={sfxEnabled ? "contained" : "outlined"}
              onClick={toggleSfx}
              sx={{ fontSize: "0.65rem", py: 0.25, px: 0.75 }}
            >
              SFX {sfxEnabled ? "On" : "Off"}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(155,89,182,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "silver.dark", display: "block", mb: 1 }}
          >
            Modal Previews
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenTarot}
              sx={{
                fontSize: "0.65rem",
                py: 0.25,
                px: 0.75,
              }}
            >
              Tarot
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onOpenGameOver}
              sx={{
                fontSize: "0.65rem",
                py: 0.25,
                px: 0.75,
              }}
            >
              Game Over
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(155,89,182,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "silver.dark", display: "block", mb: 1 }}
          >
            Player Stacks
          </Typography>
          {state.players.map((player) => (
            <Box
              key={player.id}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "silver.light",
                  width: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "0.7rem",
                }}
              >
                {player.name}
              </Typography>
              <TextField
                size="small"
                type="number"
                value={stackInputs[player.id] ?? ""}
                onChange={(e) => handleStackChange(player.id, e.target.value)}
                onBlur={() => handleStackBlur(player.id)}
                inputProps={{
                  min: 0,
                  style: {
                    fontSize: "0.7rem",
                    padding: "4px 6px",
                    color: "#e0e0e0",
                  },
                }}
                sx={{
                  width: 100,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "silver.dark" },
                    "&:hover fieldset": { borderColor: "silver.main" },
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "rgba(155,89,182,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "silver.dark", display: "block", mb: 1, p: 2, pb: 0 }}
          >
            Arcana Effects
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ color: "silver.light", flex: 1, fontSize: "0.7rem" }}
            >
              Force Next Page
            </Typography>
            <Switch
              size="small"
              checked={!!state.forceNextPage}
              disabled={!isValidStage}
              onChange={() => dispatch({ type: "TOGGLE_FORCE_NEXT_PAGE" })}
            />
          </Box>

          {!isValidStage && (
            <Typography
              variant="caption"
              sx={{ color: "silver.dark", px: 2, py: 1, display: "block" }}
            >
              Start a hand to force arcana
            </Typography>
          )}

          <List dense sx={{ pb: 2 }}>
            {ARCANA_LIST.map(({ value, fullName, gameEffect }) => {
              const isActive = state.activeArcana?.card.value === value;
              const wasDealt = dealtValues.has(value);
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
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "silver.light",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
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
                      {wasDealt && !isActive && (
                        <CheckIcon
                          sx={{
                            fontSize: "0.85rem",
                            color: "success.main",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                    {gameEffect && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "silver.dark",
                          display: "block",
                          fontSize: "0.65rem",
                        }}
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
                    }}
                  >
                    Force
                  </Button>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Box
          sx={{
            p: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "silver.dark", display: "block", mb: 1 }}
          >
            Any issues?
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "silver.dark",
              lineHeight: 1.2,
              display: "block",
            }}
          >
            If you encounter any bugs or have suggestions for improvements,
            please report them on our{" "}
            <Link
              href="https://github.com/raphaelaleixo/arcanepoker/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issues page
            </Link>
            .
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
