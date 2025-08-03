/**
 * Единый источник истины для имен событий.
 * Используем строковые константы, потому что cc.EventTarget
 * ожидает строковые имена.
 */
export const EventNames = {
  GameStart: "GameStart",
  GameRestart: "GameRestart",
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
  BoostersSelected: "BoostersSelected",
  BoosterConfirmed: "BoosterConfirmed",
  BoosterTargetSelected: "BoosterTargetSelected",
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
  SuperTilePlaced: "SuperTilePlaced",
  /** Игрок нажал на тайл (всегда). */
  TilePressed: "TilePressed",
  /** Нажатие не считается ходом (группа < 2). */
  InvalidTap: "InvalidTap",
} as const;
