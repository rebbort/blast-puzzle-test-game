import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import type { Booster } from "./Booster";
import { EventNames } from "../events/EventNames";
import type { GameState } from "../game/GameStateMachine";

/**
 * Хранит все доступные бустеры,
 * обрабатывает их активацию и публикацию событий.
 */
export class BoosterService {
  /** Коллекция зарегистрированных бустеров по их id. */
  private boosters: Record<string, Booster> = {};
  /** Идентификатор текущего активного бустера, если есть. */
  private activeId: string | null = null;

  constructor(
    private bus: InfrastructureEventBus,
    /** Provides the current FSM state to guard activation. */
    private getState: () => GameState,
  ) {}

  /**
   * Регистрирует новый бустер.
   * @param boost Экземпляр бустера для добавления
   */
  register(boost: Booster): void {
    // Добавляем/перезаписываем бустер по ключу его id
    this.boosters[boost.id] = boost;
  }

  /**
   * Пытается активировать бустер по идентификатору.
   * Вызывает canActivate и, при успехе, start и публикацию события.
   * @param id Идентификатор бустера
   */
  activate(id: string): void {
    const boost = this.boosters[id];
    if (!boost) {
      // Неизвестный бустер — ничего не делаем
      return;
    }

    // Если другой бустер уже активен, сначала отменяем его
    if (this.activeId && this.activeId !== id) {
      this.cancel();
    }

    // Разрешаем активацию только в состоянии ожидания ввода
    if (this.getState() !== "WaitingInput") {
      return;
    }

    // Проверяем возможность активации в текущем состоянии
    if (!boost.canActivate()) {
      return;
    }

    // Переводим игру в режим выбора клетки/клеток
    boost.start();
    this.activeId = id;
    // Сообщаем подписчикам об активации конкретного бустера
    this.bus.emit(EventNames.BoosterActivated, id);
    console.debug(
      "Listeners for BoosterActivated:",
      this.bus.getListenerCount(EventNames.BoosterActivated),
    );
  }

  /**
   * Снижает счётчик charges и публикует событие BoosterConsumed.
   * @param id Идентификатор бустера
   */
  consume(id: string): void {
    const boost = this.boosters[id];
    if (!boost) {
      // Если бустер не найден, просто выходим
      return;
    }
    if (boost.charges <= 0) {
      // Нечего списывать, бустер закончился
      return;
    }
    // Уменьшаем количество зарядов
    boost.charges--;
    if (this.activeId === id) {
      this.activeId = null;
    }
    // Оповещаем, что заряд израсходован
    this.bus.emit(EventNames.BoosterConsumed, id);
  }

  /**
   * Отменяет режим активации и публикует событие BoosterCancelled.
   */
  cancel(): void {
    if (this.activeId !== null) {
      this.activeId = null;
    }
    // Сообщаем слушателям, что активация прервана
    this.bus.emit(EventNames.BoosterCancelled);
  }

  /**
   * Возвращает текущее количество зарядов для бустера.
   * @param id Идентификатор бустера
   * @returns Число оставшихся зарядов или 0, если бустер не найден
   */
  getCharges(id: string): number {
    const boost = this.boosters[id];
    return boost ? boost.charges : 0;
  }
}
