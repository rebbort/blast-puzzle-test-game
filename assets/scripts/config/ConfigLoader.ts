import { BoosterRegistry } from "../core/boosters/BoosterRegistry";

// Загружаем все настройки из JSON, чтобы их можно было править без перекомпиляции
const gameCfg: {
  board: BoardConfig;
  boosterLimits: BoosterLimitConfig;
} = require("./gameConfig.json"); // eslint-disable-line @typescript-eslint/no-require-imports

/**
 * BoardConfig описывает параметры игрового поля: количество колонок и строк,
 * размер тайла, список возможных цветов и порог создания супер-тайла.
 */
export interface SuperTileChances {
  row: number;
  col: number;
  bomb: number;
  clear: number;
}

export interface BoardConfig {
  cols: number; // сколько колонок на поле
  rows: number; // сколько строк на поле
  tileWidth: number; // ширина одного тайла в пикселях
  tileHeight: number; // высота одного тайла в пикселях
  colors: string[]; // допустимые цвета тайлов
  superThreshold: number; // размер группы для супер-тайла
  rngSeed?: string; // необязательно: фиксированный seed
  superChances?: SuperTileChances; // шансы появления супер-тайлов
}

/** Значения по умолчанию для поля */
export const DefaultBoard: BoardConfig = gameCfg.board;

/**
 * Пытается парсить JSON из localStorage,
 * иначе возвращает DefaultBoard.
 */
export function loadBoardConfig(): BoardConfig {
  const raw = localStorage.getItem("board-config.json");
  if (!raw) {
    // ничего не сохранено — используем дефолт
    return DefaultBoard;
  }
  try {
    // объединяем сохранённые поля с настройками по умолчанию
    // поддерживая старое поле tileSize при наличии
    const parsed = JSON.parse(raw) as Partial<
      BoardConfig & { tileSize?: number }
    >;
    const combined = Object.assign({}, DefaultBoard, parsed);
    if (typeof parsed.tileSize === "number") {
      combined.tileWidth = parsed.tileSize;
      combined.tileHeight = parsed.tileSize;
    }
    return combined;
  } catch {
    // если JSON битый, не ломаем игру
    return DefaultBoard;
  }
}

/** Настройки выбора бустеров при старте. */
export interface BoosterLimitConfig {
  /** Максимальное число различных типов бустеров, которые можно взять. */
  maxTypes: number;
  /** Лимиты по каждому типу бустера. */
  maxPerType: Record<string, number>;
}

/** Значения по умолчанию для выбора бустеров. */
export const DefaultBoosterLimits: BoosterLimitConfig = gameCfg.boosterLimits;

/** Загружает настройки лимитов бустеров из localStorage. */
export function loadBoosterLimits(): BoosterLimitConfig {
  const raw = localStorage.getItem("booster-limits.json");
  let parsed: Partial<BoosterLimitConfig> = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<BoosterLimitConfig>;
    } catch {
      parsed = {};
    }
  }

  const maxPerType: Record<string, number> = {};
  BoosterRegistry.forEach(({ id }) => {
    const stored = parsed.maxPerType?.[id];
    maxPerType[id] =
      typeof stored === "number" ? stored : DefaultBoosterLimits.maxPerType[id];
  });

  return {
    maxTypes: parsed.maxTypes ?? DefaultBoosterLimits.maxTypes,
    maxPerType,
  };
}
