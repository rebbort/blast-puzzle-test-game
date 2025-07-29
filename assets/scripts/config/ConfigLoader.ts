import { BoardConfig, DefaultBoard } from "./BoardConfig";

// Загружает конфигурацию поля из localStorage
export function loadBoardConfig(): BoardConfig {
  // получаем строку с пользовательскими настройками
  const data = localStorage.getItem("board-config.json");
  if (!data) {
    // если ничего нет, используем стандартную конфигурацию
    return DefaultBoard;
  }
  try {
    // пробуем разобрать JSON и объединить с дефолтами
    const parsed = JSON.parse(data) as Partial<BoardConfig>;
    return { ...DefaultBoard, ...parsed };
  } catch {
    // при ошибке парсинга также возвращаем дефолт
    return DefaultBoard;
  }
}
