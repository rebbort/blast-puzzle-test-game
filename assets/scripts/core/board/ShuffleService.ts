import { EventBus } from "../../infrastructure/EventBus";
import { Board } from "./Board";
import { BoardSolver } from "./BoardSolver";
import { Tile } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";

export class ShuffleService {
  private shuffleCount = 0;
  constructor(
    private board: Board,
    private solver: BoardSolver,
    private bus: EventBus,
    private maxShuffles: number = 3,
  ) {}

  /**
   * Проверяет наличие ходов и при их отсутствии:
   * - если shuffleCount < maxShuffles:
   *     эмит 'AutoShuffle', вызывает shuffle() и инкрементирует счётчик;
   * - иначе эмит 'ShuffleLimitExceeded'.
   */
  ensureMoves(): void {
    if (this.solver.hasMoves()) {
      // Если ход есть, ничего не делаем.
      return;
    }

    if (this.shuffleCount < this.maxShuffles) {
      // Сообщаем, что будет автоматическая перетасовка.
      this.bus.emit("AutoShuffle");
      // Увеличиваем счётчик перед самой операцией.
      this.shuffleCount++;
      // Перемешиваем тайлы на поле.
      this.shuffle();
    } else {
      // Достигнут предел, больше тасовать нельзя.
      this.bus.emit("ShuffleLimitExceeded");
    }
  }

  /**
   * Перемешивает все тайлы board в случайном порядке.
   * После завершения эмитится 'ShuffleDone'.
   */
  shuffle(): void {
    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    const tiles: (Tile | null)[] = [];

    // Считываем текущее состояние поля в плоский массив.
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        tiles.push(this.board.tileAt(new cc.Vec2(x, y)));
      }
    }

    // Алгоритм Фишера-Йетса для равномерного перемешивания.
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Записываем тайлы обратно на поле, проходя по колонкам.
    let idx = 0;
    for (let x = 0; x < cfg.cols; x++) {
      for (let y = 0; y < cfg.rows; y++) {
        this.board.setTile(new cc.Vec2(x, y), tiles[idx++] ?? null);
      }
    }

    // Уведомляем слушателей об окончании перетасовки.
    this.bus.emit("ShuffleDone");
  }

  /**
   * Сбрасывает счётчик использованных перетасовок.
   */
  reset(): void {
    this.shuffleCount = 0;
  }
}
