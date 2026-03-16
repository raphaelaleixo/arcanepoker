import { Box, SxProps } from "@mui/material";
import { FC } from "react";

interface PlayingCard {
  small?: boolean;
  sx?: SxProps;
}

const svgBackground = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill-opacity=".15" ><rect x="200" width="200" height="200" /><rect y="200" width="200" height="200" /></svg>`;

export const CardBack: FC<PlayingCard> = ({ small = false, sx }) => {
  return (
    <Box
      className="ApPlayingCard-back"
      sx={{
        width: small ? "3em" : "6em",
        aspectRatio: small ? "5/7" : "5/9",
        borderRadius: small ? 1 : 2,

        background: `url('data:image/svg+xml,${svgBackground}');`,
        backgroundSize: small ? "10px 10px" : "22px 22px",
        backgroundPosition: "center center",
        bgcolor: "primary.dark",
        boxSizing: "border-box",
        position: "relative",
        overflow: "clip",
        display: "flex",
        flexDirection: "column",
        p: small ? "8px 4px" : "12px 8px",
        color: "white",
        boxShadow: `inset 0 0 0 ${small ? "3px" : "4px"}`,
        userSelect: "none",
        ...sx,
      }}
    ></Box>
  );
};
