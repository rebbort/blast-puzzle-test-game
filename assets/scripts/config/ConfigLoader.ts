import { BoosterRegistry } from "../core/boosters/BoosterRegistry";

/**
 * BoardConfig описывает параметры игрового поля: количество колонок и строк,
 * размер тайла, список возможных цветов и порог создания супер-тайла.
 */
export interface BoardConfig {
  cols: number; // сколько колонок на поле
  rows: number; // сколько строк на поле
  tileWidth: number; // ширина одного тайла в пикселях
  tileHeight: number; // высота одного тайла в пикселях
  colors: string[]; // допустимые цвета тайлов
  superThreshold: number; // размер группы для супер-тайла
  rngSeed?: string; // необязательно: фиксированный seed
}

/** Значения по умолчанию для поля */
export const DefaultBoard: BoardConfig = {
  cols: 9, // классическая ширина
  rows: 10, // и высота
  tileWidth: 100, // под размеры подготовленных спрайтов
  tileHeight: 100,
  colors: ["red", "blue", "green", "yellow", "purple"],
  superThreshold: 5,
};

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
export const DefaultBoosterLimits: BoosterLimitConfig = {
  maxTypes: 2,
  maxPerType: Object.fromEntries(BoosterRegistry.map((b) => [b.id, 10])),
};

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
