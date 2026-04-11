import { setupArcanaDeck } from "../engine/deck";
import { BOT_PERSONALITIES } from "../engine/ai";
import type { StoreGameState, GamePlayer, GameBot } from "./storeTypes";
import type { TranslationKey } from "../i18n";
import en from "../i18n/locales/en.json";
import ptBr from "../i18n/locales/pt-br.json";

const locales = { en, "pt-br": ptBr } as const;

function resolveKey(language: "en" | "pt-br", key: TranslationKey): string {
  return key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, locales[language]) as string ?? key;
}

const STARTING_STACK = 1000;
const BIG_BLIND = 20;
const SMALL_BLIND = 10;

const HERO_ID = "hero";

/** The four bots in fixed seat order (positions 1–4 around the table). */
// Array order = dealing order starting left of hero (hero → merchant → swordsman → mystic → wanderer).
// position field = visual UI slot only (independent of dealing order).
const BOT_CONFIGS: (Pick<GameBot, "id" | "position" | "personality"> & { nameKey: TranslationKey })[] =
  [
    {
      id: "bot-pentacles",
      nameKey: "players.theMerchant" as TranslationKey,
      position: 3,
      personality: BOT_PERSONALITIES.pentacles,
    },
    {
      id: "bot-swords",
      nameKey: "players.theSwordsman" as TranslationKey,
      position: 1,
      personality: BOT_PERSONALITIES.swords,
    },
    {
      id: "bot-cups",
      nameKey: "players.theMystic" as TranslationKey,
      position: 2,
      personality: BOT_PERSONALITIES.cups,
    },
    {
      id: "bot-wands",
      nameKey: "players.theWanderer" as TranslationKey,
      position: 4,
      personality: BOT_PERSONALITIES.wands,
    },
  ];

function makePlayers(language: "en" | "pt-br" = "en"): GamePlayer[] {
  const hero: GamePlayer = {
    id: HERO_ID,
    name: resolveKey(language, "players.you"),
    type: "human",
    stack: STARTING_STACK,
    currentBet: 0,
    folded: false,
    isAllIn: false,
    holeCards: [],
    position: 0,
  };

  const bots: GamePlayer[] = BOT_CONFIGS.map(({ nameKey, ...cfg }) => ({
    ...cfg,
    name: resolveKey(language, nameKey),
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

export function createInitialState(language: "en" | "pt-br" = "en"): StoreGameState {
  return {
    stage: "pre-game",
    players: makePlayers(language),
    deck: [],
    communityCards: [],

    bigBlind: BIG_BLIND,
    smallBlind: SMALL_BLIND,
    potSize: 0,
    currentBet: 0,
    lastRaiseSize: BIG_BLIND,
    totalContributions: {},
    pots: [],
    dealerIndex: 0,
    activePlayerIndex: 0,

    roundActors: [],

    arcanaDeck: setupArcanaDeck(),
    activeArcana: null,
    arcanaTriggeredThisGame: false,

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
    checkCount: 0,
  };
}
