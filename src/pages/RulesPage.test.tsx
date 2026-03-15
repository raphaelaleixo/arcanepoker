import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme";
import { RulesPage } from "./RulesPage";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
}

describe("RulesPage", () => {
  it("has a Back to Home link pointing to /", () => {
    renderWithProviders(<RulesPage />);
    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("renders the Page Card section", () => {
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/the page card/i)).toBeInTheDocument();
  });

  it("renders the Major Arcana section", () => {
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/major arcana/i)).toBeInTheDocument();
  });

  it("lists The Fool as an Arcana entry", () => {
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/the fool/i)).toBeInTheDocument();
  });

  it("lists The World as an Arcana entry", () => {
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/the world/i)).toBeInTheDocument();
  });
});
