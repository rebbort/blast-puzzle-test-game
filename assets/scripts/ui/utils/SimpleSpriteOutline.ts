const { ccclass, property } = cc._decorator;

/**
 * Простая утилита для создания обводки спрайта.
 * Подкладывает увеличенный спрайт того же цвета под основной спрайт.
 */
@ccclass()
export default class SimpleSpriteOutline extends cc.Component {
  @property(cc.Color)
  outlineColor: cc.Color = cc.Color.BLACK;

  @property({ type: cc.Float, range: [0.1, 0.5, 0.1] })
  outlineScale: number = 0.1; // Насколько увеличить спрайт обводки

  @property({ type: cc.Integer, range: [0, 255, 1] })
  outlineOpacity: number = 255;

  private outlineSprite: cc.Node = null;
  private originalSprite: cc.Sprite = null;

  onLoad() {
    this.createOutline();
  }

  /**
   * Создает обводку для спрайта
   */
  private createOutline(): void {
    const sprite = this.node.getComponent(cc.Sprite);
    if (!sprite || !sprite.spriteFrame) return;

    this.originalSprite = sprite;

    // Создаем узел для обводки
    this.outlineSprite = new cc.Node("Outline");
    this.outlineSprite.parent = this.node;
    this.outlineSprite.zIndex = this.node.zIndex - 1; // Под основным спрайтом

    // Добавляем компонент спрайта
    const outlineSpriteComp = this.outlineSprite.addComponent(cc.Sprite);
    outlineSpriteComp.spriteFrame = sprite.spriteFrame;

    // Настраиваем внешний вид обводки
    this.outlineSprite.color = this.outlineColor;
    this.outlineSprite.opacity = this.outlineOpacity;

    // Увеличиваем размер для создания обводки
    const scale = 1 + this.outlineScale;
    this.outlineSprite.setScale(scale, scale);
  }

  /**
   * Обновляет обводку при изменении основного спрайта
   */
  public updateOutline(): void {
    if (!this.outlineSprite || !this.originalSprite) return;

    const outlineSpriteComp = this.outlineSprite.getComponent(cc.Sprite);
    if (outlineSpriteComp && this.originalSprite.spriteFrame) {
      outlineSpriteComp.spriteFrame = this.originalSprite.spriteFrame;
    }
  }

  /**
   * Показывает/скрывает обводку
   */
  public setOutlineVisible(visible: boolean): void {
    if (this.outlineSprite) {
      this.outlineSprite.active = visible;
    }
  }

  /**
   * Изменяет цвет обводки
   */
  public setOutlineColor(color: cc.Color): void {
    this.outlineColor = color;
    if (this.outlineSprite) {
      this.outlineSprite.color = color;
    }
  }

  /**
   * Изменяет размер обводки
   */
  public setOutlineScale(scale: number): void {
    this.outlineScale = scale;
    if (this.outlineSprite) {
      const newScale = 1 + scale;
      this.outlineSprite.setScale(newScale, newScale);
    }
  }

  /**
   * Изменяет прозрачность обводки
   */
  public setOutlineOpacity(opacity: number): void {
    this.outlineOpacity = opacity;
    if (this.outlineSprite) {
      this.outlineSprite.opacity = opacity;
    }
  }

  /**
   * Полностью пересоздает обводку (если нужно изменить все параметры)
   */
  public recreateOutline(): void {
    if (this.outlineSprite) {
      this.outlineSprite.destroy();
      this.outlineSprite = null;
    }
    this.createOutline();
  }

  onDestroy() {
    if (this.outlineSprite && this.outlineSprite.isValid) {
      this.outlineSprite.destroy();
    }
  }
}
