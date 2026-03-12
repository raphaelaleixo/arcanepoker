import { SxProps } from "@mui/material";

// --- Cards ---
export type StandardCardValue =
  | "0"
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface StandardCard {
  value: StandardCardValue;
  suit: Suit;
}

export type StandardDeck = StandardCard[];

// --- Major Arcana ---
export type ArcanaName =
  | "The Fool"
  | "The Magician"
  | "The High Priestess"
  | "The Empress"
  | "The Emperor"
  | "The Hierophant"
  | "The Lovers"
  | "The Chariot"
  | "Strength"
  | "The Hermit"
  | "Wheel of Fortune"
  | "Justice"
  | "The Hanged Man"
  | "Death"
  | "Temperance"
  | "The Devil"
  | "The Tower"
  | "The Star"
  | "The Moon"
  | "The Sun"
  | "The World";

export type ArcanaValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21";

export type ArcanaSuit = "arcana";

export interface ArcanaCard {
  suit: "arcana";
  value: ArcanaValue; // 0 (Fool) to 21 (World)
}

// --- Union Card Type ---
export type Card = StandardCard | ArcanaCard;

// --- Hand Evaluation Result ---
export interface HandResult {
  rank: string; // e.g., 'pair', 'flush', etc.
  rankValue: number; // numerical ranking 0 (worst) to 9 (best)
  bestCards: Card[];
}

// --- Player Types ---
export interface BasePlayer {
  id: string;
  name: string;
  stack: number;
  currentBet: number;
  folded: boolean;
  isAllIn: boolean;
  holeCards: StandardCard[];
  position: number;
  currentAction?: ActionType;
}

export interface AIPlayer extends BasePlayer {
  type: "ai";
  personality: {
    bluffChance: number; // 0 to 1
  };
}

export interface HumanPlayer extends BasePlayer {
  type: "human";
}

export type Player = AIPlayer | HumanPlayer;

// --- Game Stage ---
export type GameStage =
  | "pre-game"
  | "deal"
  | "pre-flop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "results";

// --- Game State ---
export interface GameState {
  stage: GameStage;
  potSize: number;
  currentBet: number;
  dealerIndex: number;
  communityCards: StandardCard[]; // 0 to 5
  players: Player[];
  activePlayerIndex: number;
  roundActions: PlayerAction[];
  deck: StandardDeck;
  results?: GameResults;
  winnerIndices?: string[];
}

// --- Player Actions ---
export type ActionType =
  | "smallBlind"
  | "bigBlind"
  | "fold"
  | "check"
  | "call"
  | "raise"
  | "bet"
  | "all-in";

export type AIAction = {
  action: ActionType;
  amount?: number;
};

export interface PlayerAction {
  playerId: string;
  action: ActionType;
  amount?: number;
  timestamp: number;
}

export type GameResults = {
  rank: string;
  rankValue: number;
  highCards: number[];
  playerId?: string;
}[];

export interface GameEvaluator {
  gameResults: GameResults;
  winner: number[];
  evaluatorActions: {
    resetResults: () => void;
    evaluate: () => void;
  };
}

export type GameStateFragment = Partial<GameState>;
export type PlayerFragment = Partial<Player>;

export type UseGame = {
  gameState: GameState;
  updateGame: (gameFragment: GameStateFragment) => void;
};

export interface PlayerInterfaceProps {
  sx?: SxProps;
  flipped?: boolean;
  player: Player;
  gameState: GameState;
}
