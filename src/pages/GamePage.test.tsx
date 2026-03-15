import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

// Mock heavy dependencies so routing can be tested in isolation
vi.mock("../store/GameContext", () => ({
  GameProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../components/Table/PokerTable", () => ({
  PokerTable: () => <div data-testid="poker-table" />,
}));

import { GamePage } from "./GamePage";

describe("GamePage", () => {
  it("renders the poker table", () => {
    render(<GamePage />);
    expect(screen.getByTestId("poker-table")).toBeInTheDocument();
  });
});
