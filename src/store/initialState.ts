import { setupArcanaDeck } from "../engine/deck";
import { BOT_PERSONALITIES } from "../engine/ai";
import type { StoreGameState, GamePlayer, GameBot } from "./storeTypes";

const STARTING_STACK = 1000;
const BIG_BLIND = 20;
const SMALL_BLIND = 10;

const HERO_ID = "hero";

/** The four bots in fixed seat order (positions 1–4 around the table). */
// Array order = dealing order starting left of hero (hero → merchant → swordsman → mystic → wanderer).
// position field = visual UI slot only (independent of dealing order).
const BOT_CONFIGS: Pick<GameBot, "id" | "name" | "position" | "personality">[] =
  [
    {
      id: "bot-pentacles",
      name: "The Merchant",
      position: 3,
      personality: BOT_PERSONALITIES.pentacles,
    },
    {
      id: "bot-swords",
      name: "The Swordsman",
      position: 1,
      personality: BOT_PERSONALITIES.swords,
    },
    {
      id: "bot-cups",
      name: "The Mystic",
      position: 2,
      personality: BOT_PERSONALITIES.cups,
    },
    {
      id: "bot-wands",
      name: "The Wanderer",
      position: 4,
      personality: BOT_PERSONALITIES.wands,
    },
  ];

function makePlayers(): GamePlayer[] {
  const hero: GamePlayer = {
    id: HERO_ID,
    name: "You",
    type: "human",
    stack: STARTING_STACK,
    currentBet: 0,
    folded: false,
    isAllIn: false,
    holeCards: [],
    position: 0,
  };

  const bots: GamePlayer[] = BOT_CONFIGS.map((cfg) => ({
    ...cfg,
    type: "ai" as const,
    stack: STARTING_STACK,
    currentBet: 0,
    folded: false,
    isAllIn: false,
    holeCards: [],
  }));

  return [hero, ...bots];
}

export const HERO_ID_CONST = HERO_ID;
/** Re-exported for use in components. */
export { HERO_ID as HERO_ID_VALUE };

export function createInitialState(): StoreGameState {
  return {
    stage: "pre-game",
    players: makePlayers(),
    deck: [],
    communityCards: [],

    bigBlind: BIG_BLIND,
    smallBlind: SMALL_BLIND,
    potSize: 0,
    currentBet: 0,
    dealerIndex: 0,
    activePlayerIndex: 0,

    roundActors: [],

    arcanaDeck: setupArcanaDeck(),
    activeArcana: null,
    arcanaTriggeredThisRound: false,

    handNumber: 1,
    isFinalHand: false,
    pendingInteraction: null,

    empress6thCardDealt: false,
    temperanceCandidates: null,
    temperanceChoices: {},
    priestessRevealedCards: {},
    foolCardIndex: null,
    moonHiddenCommunityIndex: null,
    moonAffectedIndex: null,
    justiceRevealedPlayerId: null,
    ruinsPot: 0,
    ruinsPotReady: false,
    judgementCommittedIds: [],

    winnerIds: [],
    handResults: [],
    potWon: 0,
    wheelRound: 0,
    holeCardChangeSeeds: {},
    communityChangeKey: 0,
  };
}
