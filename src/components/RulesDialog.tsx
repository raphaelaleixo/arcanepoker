import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ARCANE_MENU_PAPER_SX, HEADING_FONT } from "../theme";
import { useTranslation } from "../i18n";
import { RulesPanel } from "./RulesPanel";

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: ARCANE_MENU_PAPER_SX } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: HEADING_FONT,
          color: "gold.light",
        }}
      >
        <Typography
          variant="h5"
          component="span"
          sx={{ fontFamily: "inherit" }}
        >
          {t("rules.howToPlay")}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "silver.dark" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <RulesPanel hideTitle />
      </DialogContent>
    </Dialog>
  );
}
