/**
 * Displays the active Major Arcana card and its game-effect description.
 *
 * While the arcana is pending (not yet revealed), the card shows its back
 * and the description reads "An arcana stirs…". After reveal, the card flips
 * and the name/effect fades in. Both states share the same container height
 * via a CSS grid stack so no layout shift occurs.
 */
import { useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import { Box, Stack, Typography } from "@mui/material";
import type { ArcanaCard } from "../../types/types";
import getTarotData from "../../data/tarot";
import { useTranslation } from "../../i18n";
import { HEADING_FONT } from "../../theme";

const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
];

const toRoman = (value: string) => ROMAN[Number(value)] ?? value;

const stirsPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 1; }
`;

const revealLine = keyframes`
  0%   { opacity: 0; transform: scale(0.88); }
  100% { opacity: 1; transform: scale(1); }
`;

const nameShine = keyframes`
  0%   { background-position: -30% center; }
  80%  { background-position: 130% center; }
  100% { background-position: 130% center; }
`;

const REVEAL_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const REVEAL_STAGGER_MS = 80;

interface ArcanaDisplayProps {
  /** The arcana card to show (pending or active). Null hides the whole display. */
  arcanaCardToShow: ArcanaCard | null;
  /**
   * Set while the arcana is pending reveal (before the player clicks "Reveal Arcana").
   * When non-null, the card shows its back and the description shows the pending placeholder.
   */
  pendingArcanaCard: ArcanaCard | null;
  /**
   * Pre-fetched from the pending card so the description box has stable dimensions
   * before the reveal animation. Null when no arcana is active.
   * Shape matches tarot.arcana record values: { fullName, gameEffect? }.
   */
  displayArcanaData: { fullName: string; gameEffect?: string } | null;
}

export function ArcanaDisplay({
  arcanaCardToShow,
  pendingArcanaCard,
  displayArcanaData,
}: ArcanaDisplayProps) {
  const { language } = useTranslation();
  const tarot = getTarotData(language);
  // Keep the last revealed name/effect frozen while the card is pending (facedown).
  // Without this, the revealed box fades out while already showing the *new* card's
  // name, causing a brief flash of the next arcana's text.
  const frozenDataRef = useRef(displayArcanaData);
  const frozenCardRef = useRef(arcanaCardToShow);
  useEffect(() => {
    if (!pendingArcanaCard && arcanaCardToShow) {
      frozenDataRef.current = displayArcanaData;
      frozenCardRef.current = arcanaCardToShow;
    }
  });

  const revealedData = pendingArcanaCard ? frozenDataRef.current : displayArcanaData;
  const revealedCard = pendingArcanaCard ? frozenCardRef.current : arcanaCardToShow;

  return (
    <Box
      sx={{
        display: "grid",
        width: "100%",
        height: "7em",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        mb: 1,
      }}
    >
      {/* Arcana card + description — same grid cell, fades in when active */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{
          height: "100%",
          gridArea: "1 / 1",
          opacity: arcanaCardToShow ? 1 : 1,
          pointerEvents: arcanaCardToShow ? "auto" : "none",
          transition: "opacity 400ms ease",
        }}
      >
        {/* Description box: fixed size, CSS grid stack inside */}
        <Box
          sx={{
            minWidth: 120,
          }}
        >
          {/*
            displayArcanaData is pre-fetched from the pending card so the box
            has stable dimensions before the reveal. The CSS grid stack cross-fades
            between the "An arcana stirs…" placeholder and the revealed name/effect.
          */}
          <Box sx={{ display: "grid" }}>
            {/* Pending placeholder — visible before reveal */}
            <Box
              sx={{
                gridArea: "1 / 1",
                opacity: pendingArcanaCard ? 1 : 0,
                pointerEvents: pendingArcanaCard ? "auto" : "none",
                transition: "opacity 300ms ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "secondary.light",
                  width: "100%",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  fontFamily: HEADING_FONT,
                  animation: `${stirsPulse} 2s ease-in-out infinite`,
                }}
              >
                An arcana stirs...
              </Typography>
            </Box>
            {/* Revealed name + effect — visible after reveal, staggered per line */}
            <Box
              key={arcanaCardToShow?.value}
              sx={{
                gridArea: "1 / 1",
                opacity: arcanaCardToShow && !pendingArcanaCard ? 1 : 0,
                pointerEvents: pendingArcanaCard ? "none" : "auto",
                transition: "opacity 300ms ease",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  fontFamily: HEADING_FONT,
                  lineHeight: 1.1,
                  position: "relative",
                  color: "primary.main",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundImage: "linear-gradient(90deg, #7ad884, #7ad884)",
                  ...(arcanaCardToShow && !pendingArcanaCard && {
                    animation: `${revealLine} 350ms ${REVEAL_EASING} both`,
                  }),
                  "&::before": arcanaCardToShow && !pendingArcanaCard
                    ? {
                        content: "attr(data-text)",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundImage:
                          "linear-gradient(110deg, transparent, #c8f08a, transparent)",
                        backgroundSize: "30% 100%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "-30% center",
                        animation: `${nameShine} 5s ease-in-out 1s infinite`,
                        pointerEvents: "none",
                      }
                    : {},
                }}
                data-text={`${revealedCard ? toRoman(revealedCard.value) : ""} - ${revealedData?.fullName}`}
              >
                {revealedCard ? toRoman(revealedCard.value) : ""} - {revealedData?.fullName}
              </Typography>
              {revealedData?.gameEffect && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "silver.light",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    mt: 0.25,
                    lineHeight: 1.1,
                    ...(arcanaCardToShow && !pendingArcanaCard && {
                      animation: `${revealLine} 350ms ${REVEAL_EASING} ${REVEAL_STAGGER_MS}ms both`,
                    }),
                  }}
                >
                  {revealedData.gameEffect}
                </Typography>
              )}
              {revealedCard &&
                (() => {
                  const tags = (
                    tarot.arcana as Record<string, { tags?: string[] }>
                  )[revealedCard.value]?.tags;
                  return tags?.length ? (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "silver.light",
                        fontSize: "0.6rem",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        mt: 0.5,
                        lineHeight: 1.1,
                        opacity: 0.8,
                        ...(arcanaCardToShow && !pendingArcanaCard && {
                          animation: `${revealLine} 350ms ${REVEAL_EASING} ${REVEAL_STAGGER_MS * 2}ms both`,
                        }),
                      }}
                    >
                      {tags.join(" · ")}
                    </Typography>
                  ) : null;
                })()}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
