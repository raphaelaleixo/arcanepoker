import { Box, Typography } from "@mui/material";
import { useTranslation } from "../../i18n";

interface CardTooltipTitleProps {
  /** The main text line (e.g. "The Page (0) — lowest card"). */
  label: string;
  /** Called when the user clicks the "Learn more" link. */
  onLearnMore: () => void;
  /** Called to close the tooltip after navigating. */
  onCloseTooltip: () => void;
  /** Link text — overrides the default translated "Learn more". */
  learnMoreText?: string;
}

export function CardTooltipTitle({
  label,
  onLearnMore,
  onCloseTooltip,
  learnMoreText,
}: CardTooltipTitleProps) {
  const { t } = useTranslation();
  const linkText = learnMoreText ?? t("tooltips.learnMore");
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
        {linkText}
      </Typography>
    </Box>
  );
}
