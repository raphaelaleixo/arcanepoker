import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme";
import { HomePage } from "./HomePage";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  it("renders the game title", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText("Arcane Poker")).toBeInTheDocument();
  });

  it("has a Play link pointing to /game", () => {
    renderWithProviders(<HomePage />);
    const playLink = screen.getByRole("link", { name: /start new game/i });
    expect(playLink).toHaveAttribute("href", "/game");
  });

  it("has a Rules link pointing to /rules", () => {
    renderWithProviders(<HomePage />);
    const rulesLink = screen.getByRole("link", { name: /learn to play/i });
    expect(rulesLink).toHaveAttribute("href", "/rules");
  });
});
