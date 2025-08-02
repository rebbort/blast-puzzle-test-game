const { ccclass, property } = cc._decorator;

/**
 * Утилита для выделения спрайта тинтом.
 * Применяет цветовой тинт к спрайту для создания эффекта выделения.
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
      // Сохраняем оригинальные значения
      this.originalColor = this.node.color.clone();
      this.originalOpacity = this.node.opacity;
    }
  }

  /**
   * Переключает состояние выделения
   */
  public toggleHighlight(): void {
    if (this.isHighlighted) {
      this.clearHighlight();
    } else {
      this.setHighlight();
    }
  }

  /**
   * Устанавливает выделение
   */
  public setHighlight(): void {
    if (!this.sprite) return;

    this.isHighlighted = true;
    this.node.color = this.highlightColor;
    this.node.opacity = this.highlightOpacity;
  }

  /**
   * Убирает выделение
   */
  public clearHighlight(): void {
    if (!this.sprite) return;

    this.isHighlighted = false;
    this.node.color = this.originalColor;
    this.node.opacity = this.originalOpacity;
  }

  /**
   * Проверяет, выделен ли спрайт
   */
  public isHighlightedState(): boolean {
    return this.isHighlighted;
  }

  /**
   * Изменяет цвет выделения
   */
  public setHighlightColor(color: cc.Color): void {
    this.highlightColor = color;
    if (this.isHighlighted && this.sprite) {
      this.node.color = color;
    }
  }

  /**
   * Изменяет прозрачность выделения
   */
  public setHighlightOpacity(opacity: number): void {
    this.highlightOpacity = opacity;
    if (this.isHighlighted && this.sprite) {
      this.node.opacity = opacity;
    }
  }

  /**
   * Принудительно обновляет оригинальные значения (если спрайт изменился)
   */
  public updateOriginalValues(): void {
    if (this.sprite) {
      this.originalColor = this.node.color.clone();
      this.originalOpacity = this.node.opacity;
    }
  }

  /**
   * Сбрасывает к оригинальным значениям
   */
  public resetToOriginal(): void {
    this.clearHighlight();
    this.updateOriginalValues();
  }

  onDestroy() {
    // Убираем выделение при уничтожении
    this.clearHighlight();
  }
}
