import { Box, SxProps } from "@mui/material";
import { FC } from "react";
import { CardSwirl } from "./CardSwirl";

interface PlayingCard {
  small?: boolean;
  sx?: SxProps;
}

export const CardBack: FC<PlayingCard> = ({ small = false, sx }) => {
  return (
    <Box
      className="ApPlayingCard-back"
      sx={{
        width: small ? "3em" : "6em",
        aspectRatio: small ? "5/7" : "5/9",
        borderRadius: small ? 1 : 2,
        backgroundSize: small ? "10px 10px" : "22px 22px",
        backgroundPosition: "center center",
        bgcolor: "#16161a",
        boxSizing: "border-box",
        position: "relative",
        overflow: "clip",
        flexDirection: "column",
        p: small ? "8px 4px" : "12px 8px",
        color: "white",
        backfaceVisibility: "hidden",
        boxShadow: `inset 0 0 0 ${small ? "1px" : "4px"}`,
        userSelect: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        svg: {
          width: "1.25em",
          height: "auto",
          fill: "currentcolor",
          "&:nth-of-type(2)": {
            width: "0.75em",
            my: "0.25em",
            path: {
              stroke: "currentcolor",
              strokeWidth: 7,
              fill: "none",
            },
          },
          "&:last-child": {
            rotate: "180deg",
          },
        },
        ...sx,
      }}
    >
      <CardSwirl />
      <svg
        width="150"
        height="150"
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M65.6937 9.18041C69.1367 0.93985 80.8633 0.939868 84.3063 9.18043L97.6294 41.0681C99.0809 44.5421 102.363 46.9158 106.13 47.2164L140.712 49.9763C149.649 50.6895 153.272 61.7918 146.464 67.598L120.116 90.0655C117.246 92.5132 115.992 96.3539 116.869 100.014L124.919 133.607C126.999 142.288 117.512 149.15 109.861 144.498L80.2538 126.496C77.0283 124.535 72.9717 124.535 69.7462 126.496L40.1394 144.498C32.4882 149.15 23.0012 142.288 25.0814 133.607L33.1311 100.014C34.008 96.3539 32.7544 92.5132 29.884 90.0655L3.53637 67.598C-3.27251 61.7918 0.351255 50.6895 9.28803 49.9763L43.8697 47.2164C47.6372 46.9158 50.9191 44.5421 52.3706 41.0681L65.6937 9.18041Z"
          fill="currentcolor"
        />
      </svg>
      <CardSwirl />
    </Box>
  );
};
