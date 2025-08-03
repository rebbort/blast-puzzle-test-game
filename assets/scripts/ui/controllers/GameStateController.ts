import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";

const { ccclass, property } = cc._decorator;

/**
 * Контроллер для управления состоянием игры
 * Управляет переключением между экранами
 */
@ccclass()
export default class GameStateController extends cc.Component {
  @property(cc.Node)
  boosterSelectPopup: cc.Node = null;

  @property(cc.Node)
  gameBoard: cc.Node = null;

  start(): void {
    console.log("GameStateController start() called");
    this.setupEventListeners();
    this.setInitialState();
  }

  /**
   * Устанавливает начальное состояние
   */
  private setInitialState(): void {
    if (this.boosterSelectPopup) {
      this.boosterSelectPopup.active = true;
    } else {
      console.warn("BoosterSelectPopup not assigned in GameStateController");
    }

    if (this.gameBoard) {
      this.gameBoard.active = false;
    } else {
      console.warn("GameBoard not assigned in GameStateController");
    }
  }

  /**
   * Настраивает слушатели событий
   */
  private setupEventListeners(): void {
    // Слушаем событие запуска игры
    EventBus.on(EventNames.BoostersSelected, this.onGameStart, this);
    EventBus.on(EventNames.GameRestart, this.onGameRestart, this);
  }

  /**
   * Обработчик запуска игры
   */
  private onGameStart(charges: Record<string, number>): void {
    console.log("GameStateController: Starting game with charges:", charges);

    // Активируем GameBoard
    if (this.gameBoard) {
      this.gameBoard.active = true;
    }

    // Скрываем BoosterSelectPopup
    if (this.boosterSelectPopup) {
      this.boosterSelectPopup.active = false;
    }
  }

  /**
   * Переключает обратно к экрану выбора бустеров
   */
  public switchToBoosterSelection(): void {
    if (this.boosterSelectPopup) {
      this.boosterSelectPopup.active = true;
    }

    if (this.gameBoard) {
      this.gameBoard.active = false;
    }
  }

  /**
   * Переключает к игровой доске
   */
  public switchToGameBoard(): void {
    if (this.boosterSelectPopup) {
      this.boosterSelectPopup.active = false;
    }

    if (this.gameBoard) {
      this.gameBoard.active = true;
    }
  }

  private onGameRestart(): void {
    this.switchToBoosterSelection();
  }

  onDestroy(): void {
    EventBus.off(EventNames.BoostersSelected, this.onGameStart, this);
    EventBus.off(EventNames.GameRestart, this.onGameRestart, this);
  }
}
