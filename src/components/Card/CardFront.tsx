import { Box, SxProps } from "@mui/material";
import {
  ArcanaSuit,
  ArcanaValue,
  StandardCardValue,
  Suit,
} from "../../types/types";
import { FC } from "react";
import { WandSuitArt } from "./WandSuitArt";
import { SwordSuitArt } from "./SwordSuitArt";
import { CupsSuitArt } from "./CupsSuitArt";
import { PentaclesSuitArt } from "./PentaclesSuitArt";
import { CardRankSuit } from "./CardRankSuit";
import { ArcanaArt } from "./ArcanaArt";
import tarot from "../../data/tarot";
import { Foil } from "./Foil";

interface PlayingCard {
  rank: StandardCardValue | ArcanaValue;
  suit: Suit | ArcanaSuit;
  small?: boolean;
  sx?: SxProps;
}

export const CardFront: FC<PlayingCard> = ({
  rank,
  suit,
  small = false,
  sx,
}) => {
  const suitColor =
    rank === "21"
      ? "rose.main"
      : suit === "arcana"
        ? "secondary.dark"
        : suit === "hearts" || suit === "diamonds"
          ? "redSuit.main"
          : "blackSuit.main";

  const shadowColor = "gold.dark";

  const swirlColor = "silver.dark";

  const fullName = (tarot[suit] as Record<string, { fullName: string }>)[rank]
    .fullName;

  return (
    <Box
      className="ApPlayingCard-front"
      title={fullName}
      sx={{
        width: small ? "3em" : "6em",
        aspectRatio: small ? "5/7" : "5/9",
        borderRadius: small ? 1 : 2,
        backgroundColor:
          rank === "0" || suit === "arcana" ? "silver.light" : "#DFDFDF",
        boxSizing: "border-box",
        position: "relative",
        overflow: "clip",
        display: "flex",
        flexDirection: "column",
        p: small ? "8px 4px" : "12px 8px",
        color: rank === "0" || suit === "arcana" ? shadowColor : "transparent",
        userSelect: "none",
        ...sx,
      }}
    >
      <CardRankSuit
        small={small}
        rank={rank}
        suit={suit}
        suitColor={suitColor}
        swirlColor={swirlColor}
      />
      {!small ? (
        <CardRankSuit
          small={small}
          rank={rank}
          suit={suit}
          suitColor={suitColor}
          swirlColor={swirlColor}
          sx={{ rotate: "180deg", mt: "auto", ml: "auto" }}
        />
      ) : null}
      <Box
        className="ApPlayingCard-front-suit"
        sx={() => ({
          position: "absolute",
          top: small ? "70%" : "50%",
          left: small ? "50%" : "50%",
          transform: small
            ? "translate(-50%, -50%) scale(0.15)"
            : "translate(-50%, -50%) scale(0.3)",
          color: suitColor,
          zIndex: 0,
          "& path": {
            stroke: "currentColor",
            strokeWidth: small ? "2px" : 0,
          },
        })}
      >
        {suit === "clubs" ? <WandSuitArt /> : null}
        {suit === "spades" ? <SwordSuitArt /> : null}
        {suit === "hearts" ? <CupsSuitArt /> : null}
        {suit === "diamonds" ? <PentaclesSuitArt /> : null}
        {suit === "arcana" ? <ArcanaArt value={rank as ArcanaValue} /> : null}
      </Box>
      {rank === "0" || suit == "arcana" ? (
        <Foil
          sx={{
            position: "absolute",
            inset: "-4em",
            width: "20em",
            height: "20em",
          }}
        />
      ) : null}
    </Box>
  );
};
