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
import { useLocation } from "react-router-dom";
import { useNavigateWithTransition } from "../hooks/useNavigateWithTransition";
import { useTranslation } from "../i18n";
import type { TranslationKey } from "../i18n";
import { ARCANE_MENU_PAPER_SX, ARCANE_MENU_LIST_SX } from "../theme";
import { SettingsDialog } from "./SettingsDialog";
import { RulesDialog } from "./RulesDialog";

const GAME_ROUTES = ["/game", "/tutorial"];

const ACTIONS: { key: TranslationKey; id: string; to: string; transition: "fade" | "default" }[] = [
  { key: "nav.home", id: "home", to: "/", transition: "fade" },
  { key: "nav.newGame", id: "newGame", to: "/game", transition: "default" },
  { key: "nav.tutorial", id: "tutorial", to: "/tutorial", transition: "default" },
  { key: "nav.learnToPlay", id: "learnToPlay", to: "", transition: "fade" },
  { key: "nav.settings", id: "settings", to: "/settings", transition: "fade" },
];

export function NavFab() {
  const navigate = useNavigateWithTransition();
  const location = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const isInGame = GAME_ROUTES.includes(location.pathname);

  const handleAction = (action: (typeof ACTIONS)[number]) => {
    setOpen(false);
    if (action.id === "learnToPlay") {
      setRulesOpen(true);
    } else if (action.id === "settings" && isInGame) {
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
            <Paper sx={ARCANE_MENU_PAPER_SX}>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList autoFocusItem sx={ARCANE_MENU_LIST_SX}>
                  {ACTIONS.map((action) => (
                    <MenuItem
                      key={action.id}
                      onClick={() => handleAction(action)}
                    >
                      {t(action.key)}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <RulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </>
  );
}
