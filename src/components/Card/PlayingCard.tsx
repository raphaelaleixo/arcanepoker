import { Box, SxProps } from "@mui/material";
import {
  ArcanaSuit,
  ArcanaValue,
  StandardCardValue,
  Suit,
} from "../../types/types";
import { FC } from "react";
import { CardBack } from "./CardBack";
import { CardFront } from "./CardFront";

interface PlayingCard {
  rank?: StandardCardValue | ArcanaValue;
  suit?: Suit | ArcanaSuit;
  small?: boolean;
  flipped?: boolean;
  shade?: boolean;
  sx?: SxProps;
}

const cardSx = {
  position: "absolute",
  height: "100%",
  width: "100%",
  backfaceVisibility: "hidden",
  top: 0,
  left: 0,
};

export const PlayingCard: FC<PlayingCard> = ({
  rank,
  suit,
  flipped = false,
  shade = 0,
  small = false,
  sx,
}) => {
  return (
    <Box
      className="ApPlayingCard-root"
      sx={{
        width: small ? "3em" : "6em",
        aspectRatio: small ? "5/7" : "5/9",
        borderRadius: small ? 1 : 2,
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        perspective: "500px",
        transition: flipped
          ? "transform 750ms cubic-bezier(0.34, 1.56, 0.64,1)"
          : null,
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
        boxShadow: "rgba(99, 99, 99, 0.5) 0px 2px 8px 0px",
        ...sx,
      }}
    >
      <Box
        className="ApPlayingCard-content"
        sx={{
          transition: "transform 1s",
          transformStyle: "preserve-3d",
          height: "100%",
          "&:after": {
            content: "''",
            position: "absolute",
            inset: 0,
            borderRadius: small ? 1 : 2,
            background: `linear-gradient(to ${
              flipped ? "left" : "right"
            }, transparent, black)`,
            opacity: shade ? 0.15 : 0,
          },
        }}
      >
        <CardBack small={small} sx={cardSx} />
        {flipped && suit && rank ? (
          <CardFront
            small={small}
            rank={rank}
            suit={suit}
            sx={{ ...cardSx, transform: "rotateY(180deg)" }}
          />
        ) : (
          <CardBack
            small={small}
            sx={{ ...cardSx, transform: "rotateY(180deg)" }}
          />
        )}
      </Box>
    </Box>
  );
};
