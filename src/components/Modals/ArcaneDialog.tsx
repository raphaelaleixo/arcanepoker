import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type SxProps,
  type Theme,
} from "@mui/material";
import { ARCANE_PAPER_SX, HEADING_FONT } from "../../theme";

interface ArcaneDialogProps {
  open: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  /** Extra element rendered in the title row (e.g. a minimize button). */
  titleAction?: React.ReactNode;
  /** Override title sx for one-off tweaks (merged after defaults). */
  titleSx?: SxProps<Theme>;
  /** Content rendered inside DialogActions; when absent, no actions bar. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function ArcaneDialog({
  open,
  onClose,
  title,
  titleAction,
  titleSx,
  actions,
  children,
}: ArcaneDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: ARCANE_PAPER_SX } }}
    >
      <DialogTitle
        sx={[
          {
            color: "gold.main",
            fontFamily: HEADING_FONT,
            textAlign: "center",
            fontSize: "1.4rem",
            borderBottom: "1px solid rgba(255,215,0,0.2)",
          },
          ...(Array.isArray(titleSx) ? titleSx : titleSx ? [titleSx] : []),
        ]}
      >
        {title}
        {titleAction}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>{children}</DialogContent>

      {actions && (
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}

/** Convenience: the standard "Got it" / "Close" button many modals use. */
export function ArcaneDialogCloseButton({
  label = "Got it",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button variant="contained" size="small" onClick={onClick}>
      {label}
    </Button>
  );
}
