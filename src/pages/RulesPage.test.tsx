import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { theme } from "../theme";
import { SettingsProvider } from "../store/SettingsContext";
import { RulesPage } from "./RulesPage";

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <SettingsProvider>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

describe("RulesPage", () => {
  it("does not render a Back to Home button", () => {
    renderWithProviders(<RulesPage />);
    expect(
      screen.queryByRole("button", { name: /back to home/i })
    ).not.toBeInTheDocument();
  });

  it("renders the Page Card section", () => {
    renderWithProviders(<RulesPage />);
    const matches = screen.getAllByText(/the page card/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Major Arcana section", () => {
    renderWithProviders(<RulesPage />);
    const matches = screen.getAllByText(/major arcana/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("lists The Fool as an Arcana entry", () => {
    renderWithProviders(<RulesPage />);
    expect(screen.getByText(/the fool/i)).toBeInTheDocument();
  });

  it("lists The World as an Arcana entry", () => {
    renderWithProviders(<RulesPage />);
    const matches = screen.getAllByText(/the world/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders all 22 Major Arcana entries", () => {
    const { container } = renderWithProviders(<RulesPage />);
    // The arcana ol starts at 0 and has 22 items
    const arcanaList = container.querySelectorAll("ol[start='0'] li");
    expect(arcanaList).toHaveLength(22);
  });
});
