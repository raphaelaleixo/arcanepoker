import { keyframes } from "@emotion/react";
import { Box } from "@mui/material";

const dealerPopIn = keyframes`
  0%   { transform: scale(0); }
  70%  { transform: scale(1.25); }
  100% { transform: scale(1); }
`;

const dealerPopOut = keyframes`
  0%   { transform: scale(1); }
  100% { transform: scale(0); }
`;

interface DealerBadgeProps {
  exiting?: boolean;
}

export function DealerBadge({ exiting = false }: DealerBadgeProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: "50%",
        bgcolor: "secondary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: "bold",
        fontFamily: "Rubik, sans-serif",
        color: "#fff",
        zIndex: 10,
        pointerEvents: "none",
        animation: exiting
          ? `${dealerPopOut} 250ms ease-in both`
          : `${dealerPopIn} 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
      }}
    >
      D
    </Box>
  );
}
