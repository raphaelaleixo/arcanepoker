/**
 * A settings section with an overline title, optional divider above, and children.
 */
import type React from "react";
import { Divider, Typography } from "@mui/material";

interface SettingSectionProps {
  title: string;
  /** Hide the top divider for the first section. */
  hideDivider?: boolean;
  children: React.ReactNode;
}

export function SettingSection({
  title,
  hideDivider = false,
  children,
}: SettingSectionProps) {
  return (
    <>
      {!hideDivider && (
        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />
      )}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        {title}
      </Typography>
      {children}
    </>
  );
}
