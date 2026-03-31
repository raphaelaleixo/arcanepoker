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
  {
    icon: <SportsEsportsIcon />,
    name: "New Game",
    to: "/game",
    transition: "default" as const,
  },
  {
    icon: <SchoolIcon />,
    name: "Tutorial",
    to: "/tutorial",
    transition: "default" as const,
  },
  {
    icon: <MenuBookIcon />,
    name: "Learn to Play",
    to: "/rules",
    transition: "fade" as const,
  },
  { icon: <HomeIcon />, name: "Home", to: "/", transition: "fade" as const },
];

export function NavFab() {
  const navigate = useNavigateWithTransition();

  return (
    <SpeedDial
      ariaLabel="Navigation menu"
      color="primary"
      icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<CloseIcon />} />}
      direction="down"
      FabProps={{
        size: "small",
      }}
      sx={{ position: "fixed", top: 16, left: 8, zIndex: 1300 }}
    >
      {ACTIONS.map((action) => (
        <SpeedDialAction
          slotProps={{
            fab: {
              color: "primary",
            },
            tooltip: {
              title: action.name,
              placement: "right",
            },
          }}
          key={action.name}
          icon={action.icon}
          onClick={() => navigate(action.to, action.transition)}
          sx={{
            backgroundColor: "primary.dark",
            "&:hover": {
              backgroundColor: "primary.main",
            },
            "&:active": {
              backgroundColor: "primary.main",
            },
          }}
        />
      ))}
    </SpeedDial>
  );
}
