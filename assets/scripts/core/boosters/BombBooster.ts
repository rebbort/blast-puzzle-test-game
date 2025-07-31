import { Booster } from "./Booster";
import { Board } from "../board/Board";
import { EventBus } from "../../infrastructure/EventBus";
import { BombCommand } from "../board/commands/BombCommand";
import { EventNames } from "../events/EventNames";

/**
 * Бомба: при активации ждёт клика,
 * затем создаёт BombCommand.
 */
export class BombBooster implements Booster {
  id = "bomb";
  charges: number;
  constructor(
    private board: Board,
    private bus: EventBus,
    charges: number,
    private radius: number,
  ) {
    this.charges = charges;
  }

  canActivate(): boolean {
    return this.charges > 0;
  }

  start(): void {
    // Подписываемся на единичный выбор клетки. После клика расходуем заряд
    // и запускаем команду бомбы. Используем once, чтобы автоматически
    // снять обработчик после первого срабатывания.
    this.bus.once(EventNames.GroupSelected, (pos: unknown) => {
      if (this.charges <= 0) return;
      const p = pos as cc.Vec2;
      this.charges--;
      // уведомляем систему, что заряд израсходован
      this.bus.emit(EventNames.BoosterConsumed, this.id);
      // выполняем команду бомбы асинхронно
      void new BombCommand(this.board, p, this.radius, this.bus).execute();
    });
  }
}
