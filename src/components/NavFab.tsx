// src/components/NavFab.tsx
import { useRef, useState } from "react";
import {
  ClickAwayListener,
  Fab,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigateWithTransition } from "../hooks/useNavigateWithTransition";

const ACTIONS = [
  { name: "Home", to: "/", transition: "fade" as const },
  { name: "New Game", to: "/game", transition: "default" as const },
  { name: "Tutorial", to: "/tutorial", transition: "default" as const },
  { name: "Learn to Play", to: "/rules", transition: "fade" as const },
  { name: "Settings", to: "/settings", transition: "fade" as const },
];

export function NavFab() {
  const navigate = useNavigateWithTransition();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

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
                      onClick={() => {
                        setOpen(false);
                        navigate(action.to, action.transition);
                      }}
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
    </>
  );
}
