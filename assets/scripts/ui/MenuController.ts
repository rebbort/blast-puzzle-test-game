const { ccclass } = cc._decorator;

/**
 * Controls interactions on the main menu.
 * Attached to the Play button.
 */
@ccclass("MenuController")
export class MenuController extends cc.Component {
  /** Loads the main GameScene when the Play button is clicked. */
  onPlay(): void {
    cc.director.loadScene("GameScene");
  }
}
