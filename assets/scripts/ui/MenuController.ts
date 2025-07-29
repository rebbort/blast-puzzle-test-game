import { _decorator, Component, director } from "cc";
const { ccclass } = _decorator;

/**
 * Controls interactions on the main menu.
 * Attached to the Play button.
 */
@ccclass("MenuController")
export class MenuController extends Component {
  /** Loads the main GameScene when the Play button is clicked. */
  onPlay(): void {
    director.loadScene("GameScene");
  }
}
