const { ccclass, property } = cc._decorator;

/**
 * Utility for highlighting a sprite with a tint.
 * Applies a color tint to the sprite to create a highlight effect.
 */
@ccclass()
export default class SpriteHighlight extends cc.Component {
  @property(cc.Color)
  highlightColor: cc.Color = cc.Color.YELLOW;

  @property({ type: cc.Integer, range: [0, 255, 1] })
  highlightOpacity: number = 255;

  private originalColor: cc.Color = cc.Color.WHITE;
  private originalOpacity: number = 255;
  private isHighlighted: boolean = false;
  private sprite: cc.Sprite = null;

  onLoad() {
    this.sprite = this.node.getComponent(cc.Sprite);
    if (this.sprite) {
      // Save the original values
      this.originalColor = this.node.color.clone();
      this.originalOpacity = this.node.opacity;
    }
  }

  /**
   * Toggles the highlight state
   */
  public toggleHighlight(): void {
    if (this.isHighlighted) {
      this.clearHighlight();
    } else {
      this.setHighlight();
    }
  }

  /**
   * Sets the highlight
   */
  public setHighlight(): void {
    if (!this.sprite) return;

    this.isHighlighted = true;
    this.node.color = this.highlightColor;
    this.node.opacity = this.highlightOpacity;
  }

  /**
   * Removes the highlight
   */
  public clearHighlight(): void {
    if (!this.sprite) return;

    this.isHighlighted = false;
    this.node.color = this.originalColor;
    this.node.opacity = this.originalOpacity;
  }

  /**
   * Checks if the sprite is highlighted
   */
  public isHighlightedState(): boolean {
    return this.isHighlighted;
  }

  /**
   * Changes the highlight color
   */
  public setHighlightColor(color: cc.Color): void {
    this.highlightColor = color;
    if (this.isHighlighted && this.sprite) {
      this.node.color = color;
    }
  }

  /**
   * Changes the highlight opacity
   */
  public setHighlightOpacity(opacity: number): void {
    this.highlightOpacity = opacity;
    if (this.isHighlighted && this.sprite) {
      this.node.opacity = opacity;
    }
  }

  /**
   * Force updates the original values (if the sprite has changed)
   */
  public updateOriginalValues(): void {
    if (this.sprite) {
      this.originalColor = this.node.color.clone();
      this.originalOpacity = this.node.opacity;
    }
  }

  /**
   * Resets to the original values
   */
  public resetToOriginal(): void {
    this.clearHighlight();
    this.updateOriginalValues();
  }

  onDestroy() {
    // Remove the highlight when destroying
    this.clearHighlight();
  }
}
