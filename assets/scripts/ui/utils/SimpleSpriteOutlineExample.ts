const { ccclass, property } = cc._decorator;

import SimpleSpriteOutline from "./SimpleSpriteOutline";

/**
 * Пример использования SimpleSpriteOutline
 */
@ccclass()
export default class SimpleSpriteOutlineExample extends cc.Component {
  @property(cc.Sprite)
  targetSprite: cc.Sprite = null;

  @property(cc.Color)
  outlineColor: cc.Color = cc.Color.BLACK;

  @property({ type: cc.Float, range: [0.05, 0.3, 0.05] })
  outlineScale: number = 0.1;

  private outlineComponent: SimpleSpriteOutline = null;

  start() {
    if (this.targetSprite) {
      this.addOutlineToSprite(this.targetSprite.node);
    }
  }

  /**
   * Добавляет обводку к спрайту
   */
  private addOutlineToSprite(spriteNode: cc.Node): void {
    // Добавляем компонент обводки
    this.outlineComponent = spriteNode.addComponent(SimpleSpriteOutline);

    // Настраиваем параметры обводки
    this.outlineComponent.outlineColor = this.outlineColor;
    this.outlineComponent.outlineScale = this.outlineScale;
  }

  /**
   * Изменяет цвет обводки
   */
  public changeOutlineColor(color: cc.Color): void {
    if (this.outlineComponent) {
      this.outlineComponent.setOutlineColor(color);
    }
  }

  /**
   * Изменяет размер обводки
   */
  public changeOutlineScale(scale: number): void {
    if (this.outlineComponent) {
      this.outlineComponent.setOutlineScale(scale);
    }
  }

  /**
   * Показывает/скрывает обводку
   */
  public toggleOutline(visible: boolean): void {
    if (this.outlineComponent) {
      this.outlineComponent.setOutlineVisible(visible);
    }
  }

  /**
   * Анимация обводки для выделения
   */
  public animateOutline(): void {
    if (!this.outlineComponent) return;

    // Создаем анимацию изменения цвета обводки
    const originalColor = this.outlineComponent.outlineColor;
    const highlightColor = cc.Color.YELLOW;

    // Анимация к желтому цвету и обратно
    cc.tween(this.outlineComponent.node)
      .call(() => this.outlineComponent.setOutlineColor(highlightColor))
      .delay(0.2)
      .call(() => this.outlineComponent.setOutlineColor(originalColor))
      .start();
  }

  /**
   * Анимация пульсации обводки
   */
  public pulseOutline(): void {
    if (!this.outlineComponent) return;

    const originalScale = this.outlineComponent.outlineScale;
    const pulseScale = originalScale * 1.5;

    cc.tween(this.outlineComponent.node)
      .call(() => this.outlineComponent.setOutlineScale(pulseScale))
      .delay(0.1)
      .call(() => this.outlineComponent.setOutlineScale(originalScale))
      .start();
  }
}
