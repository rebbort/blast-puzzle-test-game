import { BoosterRegistry } from "../core/boosters/BoosterRegistry";

// Кеш для загруженной конфигурации
let gameConfigCache: {
  board: BoardConfig;
  boosterLimits: BoosterLimitConfig;
} | null = null;

/**
 * Загружает общую конфигурацию игры с кешированием
 */
function loadGameConfig(): {
  board: BoardConfig;
  boosterLimits: BoosterLimitConfig;
} {
  // Возвращаем кеш, если он уже загружен
  if (gameConfigCache) {
    return gameConfigCache;
  }

  try {
    // Пытаемся загрузить из ресурсов Cocos Creator
    const gameConfig = cc.resources.get("config/gameConfig");
    if (gameConfig) {
      const config = gameConfig as unknown as {
        board: BoardConfig;
        boosterLimits: BoosterLimitConfig;
      };

      // Кешируем результат
      gameConfigCache = {
        board: { ...DefaultBoard, ...config.board },
        boosterLimits: { ...DefaultBoosterLimits, ...config.boosterLimits },
      };

      return gameConfigCache;
    }
  } catch (error) {
    console.warn("Failed to load game config from resources:", error);
  }

  // Fallback на значения по умолчанию
  gameConfigCache = {
    board: DefaultBoard,
    boosterLimits: DefaultBoosterLimits,
  };

  return gameConfigCache;
}

/**
 * Очищает кеш конфигурации (для тестирования или перезагрузки)
 */
export function clearConfigCache(): void {
  gameConfigCache = null;
}

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
 * Загружает конфигурацию игрового поля.
 */
export function loadBoardConfig(): BoardConfig {
  const config = loadGameConfig();
  return config.board;
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
  const config = loadGameConfig();
  return config.boosterLimits;
}
