// src/components/NavFab.tsx
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { useNavigateWithTransition } from "../hooks/useNavigateWithTransition";

const ACTIONS = [
  { icon: <SportsEsportsIcon />, name: "New Game",      to: "/game",    transition: "default" as const },
  { icon: <SchoolIcon />,        name: "Tutorial",      to: "/tutorial", transition: "default" as const },
  { icon: <MenuBookIcon />,      name: "Learn to Play", to: "/rules",   transition: "fade" as const },
  { icon: <HomeIcon />,          name: "Home",          to: "/",        transition: "fade" as const },
];

export function NavFab() {
  const navigate = useNavigateWithTransition();

  return (
    <SpeedDial
      ariaLabel="Navigation menu"
      icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<CloseIcon />} />}
      direction="down"
      sx={{ position: "fixed", top: 16, left: 16, zIndex: 1300 }}
    >
      {ACTIONS.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipPlacement="right"
          onClick={() => navigate(action.to, action.transition)}
        />
      ))}
    </SpeedDial>
  );
}
