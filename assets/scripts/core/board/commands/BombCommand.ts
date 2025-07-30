import { Board } from "../Board";
import { EventBus } from "../../../infrastructure/EventBus";
import { ICommand } from "./ICommand";
import { RemoveCommand } from "./RemoveCommand";

/**
 * Схлопывает все тайлы в радиусе R от center.
 */
export class BombCommand implements ICommand {
  constructor(
    private board: Board,
    private center: cc.Vec2,
    private radius: number,
    private bus: EventBus,
  ) {}

  async execute(): Promise<void> {
    // Собираем координаты вокруг центра, исключая саму клетку.
    // Перебираем квадрат [-R,R] и используем условие
    // max(|dx|,|dy|) <= R, что соответствует радиусу по Чебышёву.
    // Точки за границами поля игнорируются.
    const group: cc.Vec2[] = [];
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        // Используем метрику Чебышёва: max(|dx|,|dy|) <= R
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= this.radius) {
          if (dx === 0 && dy === 0) continue; // центр не трогаем
          const p = new cc.Vec2(this.center.x + dx, this.center.y + dy);
          // Координаты за пределами поля игнорируются
          if (this.board.inBounds(p)) group.push(p);
        }
      }
    }

    // Ждём завершения RemoveCommand
    await new Promise<void>((resolve) => {
      this.bus.once("removeDone", () => resolve());
      void new RemoveCommand(this.board, this.bus, group).execute();
    });

    // Отправляем событие о завершении применения бустера
    this.bus.emit("MoveCompleted");
  }
}
