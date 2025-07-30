/**
 * BoardConfig описывает параметры игрового поля: количество колонок и строк,
 * размер тайла, список возможных цветов и порог создания супер-тайла.
 */
export interface BoardConfig {
  cols: number; // сколько колонок на поле
  rows: number; // сколько строк на поле
  tileSize: number; // размер одного тайла в пикселях
  colors: string[]; // допустимые цвета тайлов
  superThreshold: number; // размер группы для супер-тайла
  rngSeed?: string; // необязательно: фиксированный seed
}

/** Значения по умолчанию для поля */
export const DefaultBoard: BoardConfig = {
  cols: 8, // классическая ширина
  rows: 10, // и высота
  tileSize: 96, // под размеры подготовленных спрайтов
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
    const parsed = JSON.parse(raw) as Partial<BoardConfig>;
    return Object.assign({}, DefaultBoard, parsed);
  } catch {
    // если JSON битый, не ломаем игру
    return DefaultBoard;
  }
}
