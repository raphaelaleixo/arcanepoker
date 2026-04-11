import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme";
import { SettingsProvider } from "../store/SettingsContext";
import { HomePage } from "./HomePage";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  it("renders the game title", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Arcane Poker")).toBeInTheDocument();
  });

  it("has a start new game button", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("button", { name: /start new game/i })
    ).toBeInTheDocument();
  });

  it("has a tutorial menu item in the dropdown", async () => {
    renderWithProviders(<HomePage />);
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await userEvent.click(menuButton);
    expect(
      screen.getByRole("menuitem", { name: /tutorial/i })
    ).toBeInTheDocument();
  });

  it("has a Learn to Play menu item in the dropdown", async () => {
    renderWithProviders(<HomePage />);
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await userEvent.click(menuButton);
    expect(
      screen.getByRole("menuitem", { name: /learn to play/i })
    ).toBeInTheDocument();
  });
});
