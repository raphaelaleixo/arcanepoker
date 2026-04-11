import { Box, Typography } from "@mui/material";

interface CardTooltipTitleProps {
  /** The main text line (e.g. "The Page (0) — lowest card"). */
  label: string;
  /** Called when the user clicks the "Learn more" link. */
  onLearnMore: () => void;
  /** Called to close the tooltip after navigating. */
  onCloseTooltip: () => void;
  /** Link text — defaults to "Learn more". */
  learnMoreText?: string;
}

export function CardTooltipTitle({
  label,
  onLearnMore,
  onCloseTooltip,
  learnMoreText = "Learn more",
}: CardTooltipTitleProps) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="caption"
        sx={{
          color: "white",
          display: "block",
          lineHeight: 1.2,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        component="span"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onCloseTooltip();
          onLearnMore();
        }}
        sx={{
          color: "gold.light",
          cursor: "pointer",
          textDecoration: "underline",
          fontWeight: "bold",
        }}
      >
        {learnMoreText}
      </Typography>
    </Box>
  );
}
