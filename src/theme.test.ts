import { describe, it, expect } from "vitest";
import { theme } from "./theme";

type StyleFn = (props: {
  ownerState: { variant?: string; color?: string };
  theme: typeof theme;
}) => Record<string, unknown>;

const rootOverride = theme.components?.MuiButton?.styleOverrides
  ?.root as StyleFn;

describe("MuiButton theme override — contained primary glow", () => {
  it("adds position:relative to contained primary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "primary" },
      theme,
    });
    expect(styles).toHaveProperty("position", "relative");
  });

  it("includes ::before and ::after inside &:hover for contained primary", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "primary" },
      theme,
    }) as Record<string, Record<string, unknown>>;
    expect(styles["&:hover"]).toBeDefined();
    expect(styles["&:hover"]["&::before"]).toBeDefined();
    expect(styles["&:hover"]["&::after"]).toBeDefined();
  });

  it("does NOT add position:relative to contained secondary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "contained", color: "secondary" },
      theme,
    });
    expect(styles).not.toHaveProperty("position");
  });

  it("does NOT add position:relative to outlined primary buttons", () => {
    const styles = rootOverride({
      ownerState: { variant: "outlined", color: "primary" },
      theme,
    });
    expect(styles).not.toHaveProperty("position");
  });
});
