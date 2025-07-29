/**
 * Определения модели игрового тайла.
 */

/**
 * Допустимые цвета тайлов на поле.
 */
export type TileColor = "red" | "blue" | "green" | "yellow" | "purple";

/**
 * Перечисление видов тайлов.
 */
export enum TileKind {
  /** обычный тайл */
  Normal,
  /** супер‑тайл: сжигает строку */
  SuperRow,
  /** супер‑тайл: сжигает столбец */
  SuperCol,
  /** радиус R */
  SuperBomb,
  /** очищает всё поле */
  SuperClear,
}

/**
 * Интерфейс игрового тайла.
 */
export interface Tile {
  /** уникальный идентификатор */
  id: number;
  /** цвет тайла */
  color: TileColor;
  /** тип тайла */
  kind: TileKind;
}

/**
 * Фабрика для создания тайлов.
 */
export class TileFactory {
  /** счётчик идентификаторов */
  private static nextId = 0;

  /**
   * Создаёт обычный тайл заданного цвета.
   * @param color Цвет тайла
   * @returns Новый тайл с типом {@link TileKind.Normal}
   */
  public static createNormal(color: TileColor): Tile {
    return {
      id: ++this.nextId,
      color,
      kind: TileKind.Normal,
    };
  }
}
