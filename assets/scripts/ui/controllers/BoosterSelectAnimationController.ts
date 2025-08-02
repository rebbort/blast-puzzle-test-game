const { ccclass, property } = cc._decorator;

/**
 * Контроллер анимации для BoosterSelectPopup.
 * Оживляет появление элементов с последовательными анимациями.
 */
@ccclass()
export default class BoosterSelectAnimationController extends cc.Component {
  @property(cc.Node)
  gameNameLabel: cc.Node = null;

  @property(cc.Node)
  selectBoosterLabel: cc.Node = null;

  @property(cc.Node)
  boosterSelectBackground: cc.Node = null;

  @property([cc.Node])
  boosterSlots: cc.Node[] = [];

  @property(cc.Node)
  playButton: cc.Node = null;

  // Настройки анимации
  @property({ type: cc.Float, range: [0.1, 1.0, 0.1] })
  labelDelay: number = 0.2;

  @property({ type: cc.Float, range: [0.1, 1.0, 0.1] })
  backgroundDelay: number = 0.4;

  @property({ type: cc.Float, range: [0.1, 1.0, 0.1] })
  slotsDelay: number = 0.6;

  @property({ type: cc.Float, range: [0.1, 1.0, 0.1] })
  playButtonDelay: number = 1.2;

  @property({ type: cc.Float, range: [0.1, 0.5, 0.1] })
  bounceDuration: number = 0.3;

  @property({ type: cc.Float, range: [0.1, 0.5, 0.1] })
  scaleDuration: number = 0.4;

  @property({ type: cc.Float, range: [0.1, 0.5, 0.1] })
  rotationDuration: number = 0.3;

  private originalScales: Map<cc.Node, number> = new Map();
  private originalRotations: Map<cc.Node, cc.Vec3> = new Map();

  onLoad() {
    this.storeOriginalTransforms();
    this.hideAllElements();
  }

  start() {
    this.checkReferences();
    this.playEntranceAnimation();
  }

  /**
   * Сохраняет оригинальные трансформации элементов
   */
  private storeOriginalTransforms(): void {
    const elements = [
      this.gameNameLabel,
      this.selectBoosterLabel,
      this.boosterSelectBackground,
      ...this.boosterSlots,
      this.playButton,
    ];

    elements.forEach((element) => {
      if (element) {
        this.originalScales.set(element, element.scale);
        this.originalRotations.set(element, element.eulerAngles);
      } else {
        console.warn("Element is null in storeOriginalTransforms");
      }
    });
  }

  /**
   * Скрывает все элементы перед анимацией
   */
  private hideAllElements(): void {
    const elements = [
      this.gameNameLabel,
      this.selectBoosterLabel,
      this.boosterSelectBackground,
      ...this.boosterSlots,
      this.playButton,
    ];

    elements.forEach((element) => {
      if (element) {
        element.setScale(0, 0, 0);
        element.opacity = 0;
        // НЕ скрываем элемент полностью, только делаем невидимым
        // element.active = false;
      } else {
        console.warn("Element is null in hideAllElements");
      }
    });
  }

  /**
   * Запускает полную анимацию появления
   */
  public playEntranceAnimation(): void {
    // Анимация лейблов
    this.scheduleOnce(() => {
      this.animateLabel(this.gameNameLabel);
    }, 0);

    this.scheduleOnce(() => {
      this.animateLabel(this.selectBoosterLabel);
    }, this.labelDelay);

    // Анимация фона
    this.scheduleOnce(() => {
      this.animateBackground();
    }, this.backgroundDelay);

    // Анимация слотов
    this.scheduleOnce(() => {
      this.animateSlots();
    }, this.slotsDelay);

    // Анимация кнопки
    this.scheduleOnce(() => {
      this.animatePlayButton();
    }, this.playButtonDelay);
  }

  /**
   * Анимация лейбла с баунс эффектом
   */
  private animateLabel(label: cc.Node): void {
    if (!label) {
      console.warn("Label is null in animateLabel");
      return;
    }

    console.log(`Animating label: ${label.name}`);

    // Показываем элемент
    label.active = true;
    label.opacity = 255;
    label.setScale(0, 0, 0);

    // Анимация появления с баунс
    cc.tween(label)
      .to(this.bounceDuration, { scale: 1 }, { easing: "backOut" })
      .to(this.bounceDuration * 0.5, { scale: 1 }, { easing: "backOut" })
      .start();
  }

  /**
   * Анимация фона
   */
  private animateBackground(): void {
    if (!this.boosterSelectBackground) {
      console.warn("BoosterSelectBackground is null");
      return;
    }

    this.boosterSelectBackground.active = true;
    this.boosterSelectBackground.opacity = 255;
    this.boosterSelectBackground.setScale(0, 0, 0);

    cc.tween(this.boosterSelectBackground)
      .to(this.bounceDuration, { scale: 1 }, { easing: "backOut" })
      .to(this.bounceDuration * 0.5, { scale: 1 }, { easing: "backOut" })
      .start();
  }

  /**
   * Анимация слотов с ростом и поворотом
   */
  private animateSlots(): void {
    this.boosterSlots.forEach((slot, index) => {
      if (!slot) {
        console.warn(`Slot ${index} is null`);
        return;
      }

      const delay = index * 0.1; // Небольшая задержка между слотами

      this.scheduleOnce(() => {
        this.animateSlot(slot);
      }, delay);
    });
  }

  /**
   * Анимация отдельного слота
   */
  private animateSlot(slot: cc.Node): void {
    if (!slot) return;

    const originalScale = this.originalScales.get(slot) || 1;

    // Начальное состояние
    slot.active = true;
    slot.opacity = 255;
    slot.setScale(originalScale * 0.3);

    // Анимация роста
    cc.tween(slot)
      .to(
        this.scaleDuration,
        {
          scale: originalScale,
        },
        { easing: "backOut" },
      )
      .start();
  }

  /**
   * Анимация кнопки Play с баунс эффектом
   */
  private animatePlayButton(): void {
    if (!this.playButton) {
      console.warn("PlayButton is null");
      return;
    }

    this.playButton.active = true;
    this.playButton.opacity = 255;
    this.playButton.setScale(0, 0, 0);

    cc.tween(this.playButton)
      .to(this.bounceDuration, { scale: 1.2 }, { easing: "backOut" })
      .to(this.bounceDuration * 0.5, { scale: 1 }, { easing: "backOut" })
      .start();
  }

  /**
   * Перезапускает анимацию
   */
  public replayAnimation(): void {
    this.hideAllElements();
    this.playEntranceAnimation();
  }

  /**
   * Быстрое появление всех элементов (без анимации)
   */
  public showAllImmediately(): void {
    console.log("Showing all elements immediately");

    const elements = [
      this.gameNameLabel,
      this.selectBoosterLabel,
      this.boosterSelectBackground,
      ...this.boosterSlots,
      this.playButton,
    ];

    elements.forEach((element) => {
      if (element) {
        element.opacity = 255;
        const originalScale = this.originalScales.get(element) || 1;
        const originalRotation = this.originalRotations.get(element);
        element.setScale(originalScale);
        element.eulerAngles = originalRotation;
      } else {
        console.warn("Element is null in showAllImmediately");
      }
    });
  }

  private checkReferences(): void {
    if (!this.gameNameLabel) {
      console.error(
        "GameNameLabel is null in BoosterSelectAnimationController",
      );
    }
    if (!this.selectBoosterLabel) {
      console.error(
        "SelectBoosterLabel is null in BoosterSelectAnimationController",
      );
    }
    if (!this.boosterSelectBackground) {
      console.error(
        "BoosterSelectBackground is null in BoosterSelectAnimationController",
      );
    }
    if (this.boosterSlots.length === 0) {
      console.error(
        "BoosterSlots array is empty in BoosterSelectAnimationController",
      );
    }
    if (!this.playButton) {
      console.error("PlayButton is null in BoosterSelectAnimationController");
    }
  }
}
