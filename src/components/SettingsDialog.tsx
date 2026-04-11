import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ARCANE_MENU_PAPER_SX, HEADING_FONT } from "../theme";
import { SettingsPanel } from "./SettingsPanel";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          Settings
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
        <SettingsPanel />
      </DialogContent>
    </Dialog>
  );
}
