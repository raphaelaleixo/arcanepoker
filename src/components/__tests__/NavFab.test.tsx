// src/components/__tests__/NavFab.test.tsx
import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../../theme";
import { SettingsProvider } from "../../store/SettingsContext";
import { NavFab } from "../NavFab";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

describe("NavFab", () => {
  it("renders the speed dial trigger button", () => {
    renderWithProviders(<NavFab />);
    expect(
      screen.getByRole("button", { name: /navigation menu/i })
    ).toBeInTheDocument();
  });

  it("shows all 4 action labels when opened", async () => {
    renderWithProviders(<NavFab />);
    const trigger = screen.getByRole("button", { name: /navigation menu/i });
    await userEvent.click(trigger);
    // MUI SpeedDial renders action labels as aria-label on the menuitem buttons
    // rather than as visible text nodes, so we query by accessible name.
    expect(screen.getByRole("menuitem", { name: "New game" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Learn to play" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Home" })).toBeInTheDocument();
  });
});
