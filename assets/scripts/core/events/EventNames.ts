/**
 * Единый источник истины для имен событий.
 * Используем строковые константы, потому что cc.EventTarget
 * ожидает строковые имена.
 */
export const EventNames = {
  GameStart: "GameStart",
  GroupSelected: "GroupSelected",
  TilesRemoved: "TilesRemoved",
  MoveCompleted: "MoveCompleted",
  FillStarted: "FillStarted",
  FillDone: "FillDone",
  FallStarted: "FallStarted",
  FallDone: "FallDone",
  TurnsInit: "TurnsInit",
  TurnUsed: "TurnUsed",
  TurnEnded: "TurnEnded",
  OutOfTurns: "OutOfTurns",
  GameWon: "GameWon",
  GameLost: "GameLost",
  BoosterActivated: "BoosterActivated",
  BoosterConsumed: "BoosterConsumed",
  BoosterCancelled: "BoosterCancelled",
  StateChanged: "StateChanged",
  GamePaused: "GamePaused",
  GameResumed: "GameResumed",
  AnimationStarted: "AnimationStarted",
  AnimationEnded: "AnimationEnded",
  AutoShuffle: "AutoShuffle",
  ShuffleLimitExceeded: "ShuffleLimitExceeded",
  ShuffleDone: "ShuffleDone",
  GroupFound: "GroupFound",
  SwapCancelled: "SwapCancelled",
  SwapDone: "SwapDone",
  RemoveStarted: "RemoveStarted",
  SuperTileCreated: "SuperTileCreated",
} as const;
