// src/components/NavFab.tsx
import { useRef, useState } from "react";
import {
  ClickAwayListener,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation } from "react-router-dom";
import { useNavigateWithTransition } from "../hooks/useNavigateWithTransition";
import { SettingsPanel } from "./SettingsPanel";

const GAME_ROUTES = ["/game", "/tutorial"];

const ACTIONS = [
  { name: "Home", to: "/", transition: "fade" as const },
  { name: "New Game", to: "/game", transition: "default" as const },
  { name: "Tutorial", to: "/tutorial", transition: "default" as const },
  { name: "Learn to Play", to: "/rules", transition: "fade" as const },
  { name: "Settings", to: "/settings", transition: "fade" as const },
];

export function NavFab() {
  const navigate = useNavigateWithTransition();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const isInGame = GAME_ROUTES.includes(location.pathname);

  const handleAction = (action: (typeof ACTIONS)[number]) => {
    setOpen(false);
    if (action.name === "Settings" && isInGame) {
      setSettingsOpen(true);
    } else {
      navigate(action.to, action.transition);
    }
  };

  return (
    <>
      <Fab
        ref={anchorRef}
        size="small"
        color="primary"
        aria-label="Navigation menu"
        onClick={() => setOpen((prev) => !prev)}
        sx={{ position: "fixed", top: 16, left: 16, zIndex: 1300 }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </Fab>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        placement="bottom-start"
        modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
        sx={{ zIndex: 1300, width: 200 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "left top" }}>
            <Paper
              sx={{
                bgcolor: "blackSuit.main",
                border: 1,
                borderColor: "blackSuit.light",
                color: "#fff",
              }}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList
                  autoFocusItem
                  sx={{
                    "& .MuiMenuItem-root": {
                      fontFamily: "Young Serif, serif",
                      fontSize: "0.875em",
                    },
                    "& .MuiMenuItem-root:hover": {
                      bgcolor: "transparent",
                      color: "secondary.main",
                    },
                  }}
                >
                  {ACTIONS.map((action) => (
                    <MenuItem
                      key={action.name}
                      onClick={() => handleAction(action)}
                    >
                      {action.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "blackSuit.main",
              border: 1,
              borderColor: "blackSuit.light",
              color: "#fff",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Young Serif, serif",
            color: "gold.light",
          }}
        >
          <Typography
            variant="h5"
            component="span"
            sx={{ fontFamily: "inherit" }}
          >
            Settings
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setSettingsOpen(false)}
            sx={{ color: "silver.dark" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <SettingsPanel />
        </DialogContent>
      </Dialog>
    </>
  );
}
