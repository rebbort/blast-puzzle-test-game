import { EventBus } from "../../core/EventBus";
import { EventNames } from "../../core/events/EventNames";

const { ccclass, property } = cc._decorator;

/**
 * Controller for managing the game state
 * Manages switching between screens
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
   * Sets the initial state
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
   * Sets event listeners
   */
  private setupEventListeners(): void {
    // Listen to the game start event
    EventBus.on(EventNames.BoostersSelected, this.onGameStart, this);
    EventBus.on(EventNames.GameRestart, this.onGameRestart, this);
  }

  /**
   * Game start handler
   */
  private onGameStart(charges: Record<string, number>): void {
    console.log("GameStateController: Starting game with charges:", charges);
    this.switchToGameBoard();
  }

  private onGameRestart(): void {
    this.switchToBoosterSelection();
  }

  /**
   * Switches back to the booster selection screen
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
   * Switches to the game board
   */
  public switchToGameBoard(): void {
    if (this.boosterSelectPopup) {
      this.boosterSelectPopup.active = false;
    }

    if (this.gameBoard) {
      this.gameBoard.active = true;
    }
  }

  onDestroy(): void {
    EventBus.off(EventNames.BoostersSelected, this.onGameStart, this);
    EventBus.off(EventNames.GameRestart, this.onGameRestart, this);
  }
}
