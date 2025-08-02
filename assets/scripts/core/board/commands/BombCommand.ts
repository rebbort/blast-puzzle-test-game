import { Board } from "../Board";
import { InfrastructureEventBus } from "../../../infrastructure/InfrastructureEventBus";
import { ICommand } from "./ICommand";
import { MoveExecutor } from "../MoveExecutor";
import { BoardSolver } from "../BoardSolver";

/**
 * Схлопывает все тайлы в радиусе R от center.
 */
export class BombCommand implements ICommand {
  constructor(
    private board: Board,
    private center: cc.Vec2,
    private radius: number,
    private bus: InfrastructureEventBus,
  ) {}

  async execute(): Promise<void> {
    // Собираем координаты вокруг центра, включая саму клетку.
    // Перебираем квадрат [-R,R] и используем условие
    // max(|dx|,|dy|) <= R, что соответствует радиусу по Чебышёву.
    // Точки за границами поля игнорируются.
    const group: cc.Vec2[] = [];
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dy = -this.radius; dy <= this.radius; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= this.radius) {
          const p = new cc.Vec2(this.center.x + dx, this.center.y + dy);
          if (this.board.inBounds(p)) group.push(p);
        }
      }
    }

    // Расширяем группу, чтобы задетые супер-тайлы запустили свои эффекты.
    const expanded = new BoardSolver(this.board).expandBySupers(group);

    // Выполняем стандартный пайплайн remove → fall → fill.
    // Используем MoveExecutor, чтобы после удаления тайлов остальные
    // упали и заполненные позиции заполнились новыми тайлами.
    await new MoveExecutor(this.board, this.bus).execute(expanded);
  }
}
