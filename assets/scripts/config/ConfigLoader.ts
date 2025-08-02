import { BoosterRegistry } from "../core/boosters/BoosterRegistry";

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
export const DefaultBoard: BoardConfig = {
  cols: 9, // классическая ширина
  rows: 10, // и высота
  tileWidth: 100, // под размеры подготовленных спрайтов
  tileHeight: 100,
  colors: ["red", "blue", "green", "yellow", "purple"],
  superThreshold: 5,
  superChances: {
    row: 0.5, // 50% шанс SuperRow
    col: 0.3, // 30% шанс SuperCol
    bomb: 0.15, // 15% шанс SuperBomb
    clear: 0.05, // 5% шанс SuperClear
  },
};

/**
 * Пытается загрузить конфигурацию из ресурсов Cocos Creator,
 * иначе возвращает DefaultBoard.
 */
export function loadBoardConfig(): BoardConfig {
  try {
    // Пытаемся загрузить из ресурсов Cocos Creator
    const gameConfig = cc.resources.get("config/gameConfig");
    if (gameConfig) {
      const config = gameConfig as unknown as {
        board: BoardConfig;
        boosterLimits: BoosterLimitConfig;
      };
      return {
        ...DefaultBoard,
        ...config.board,
      };
    }
  } catch (error) {
    console.warn("Failed to load game config from resources:", error);
  }

  // Пытаемся загрузить из localStorage как fallback
  const raw = localStorage.getItem("board-config.json");
  if (!raw) {
    return DefaultBoard;
  }

  try {
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
export const DefaultBoosterLimits: BoosterLimitConfig = {
  maxTypes: 2,
  maxPerType: Object.fromEntries(BoosterRegistry.map((b) => [b.id, 10])),
};

/** Загружает настройки лимитов бустеров. */
export function loadBoosterLimits(): BoosterLimitConfig {
  try {
    // Пытаемся загрузить из ресурсов Cocos Creator
    const gameConfig = cc.resources.get("config/gameConfig");
    if (gameConfig) {
      const config = gameConfig as unknown as {
        board: BoardConfig;
        boosterLimits: BoosterLimitConfig;
      };
      return {
        ...DefaultBoosterLimits,
        ...config.boosterLimits,
      };
    }
  } catch (error) {
    console.warn("Failed to load booster limits from resources:", error);
  }

  // Fallback на localStorage
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
