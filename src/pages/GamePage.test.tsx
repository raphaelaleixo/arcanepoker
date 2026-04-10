import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("../store/GameContext", () => ({
  GameProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../components/Table/PokerTable", () => ({
  PokerTable: () => <div data-testid="poker-table" />,
}));
vi.mock("../hooks/useBackgroundMusic", () => ({
  useBackgroundMusic: vi.fn(),
}));
vi.mock("../hooks/useGameSounds", () => ({
  useGameSounds: vi.fn(),
}));

import { GamePage } from "./GamePage";

describe("GamePage", () => {
  it("renders the poker table", () => {
    render(<GamePage />);
    expect(screen.getByTestId("poker-table")).toBeInTheDocument();
  });
});
