const { ccclass, property } = cc._decorator;

import type { Tile, TileColor } from "../../core/board/Tile";
import { TileKind } from "../../core/board/Tile";
import { TileAppearanceConfig } from "../../core/board/TileAppearanceConfig";

/**
 * Представление игрового тайла. Содержит контейнер `visualRoot`, куда
 * подставляются разные префабы внешнего вида в зависимости от модели.
 */
@ccclass()
export default class TileView extends cc.Component {
  /** Узел, в который инстанцируются визуальные варианты тайла. */
  @property(cc.Node)
  visualRoot!: cc.Node;

  /** Префабы обычных тайлов (по цветам). Порядок соответствует перечислению цветов. */
  @property([cc.Prefab])
  normalVariants: cc.Prefab[] = [];

  /** Префабы супер‑тайлов по индексу {@link TileKind}. */
  @property([cc.Prefab])
  superVariants: cc.Prefab[] | null = null;

  /** Текущий визуальный узел, размещённый в visualRoot. */
  private currentVisual: cc.Node | null = null;

  /** Префаб эффекта активации, взятый из {@link TileAppearanceConfig}. */
  private activateFx: cc.Prefab | null = null;

  /** Кэш модели тайла для возможных обновлений. */
  public tile!: Tile;

  /** Позиция тайла на доске для логирования и событий. */
  public boardPos: cc.Vec2 = cc.v2(0, 0);

  /** Тайл в состоянии падения. */
  private isFalling = false;
  /** Тайл проигрывает feedback-анимацию. */
  private isFeedbackActive = false;

  /** Возвращает true, если тайл готов реагировать на ввод. */
  isInteractive(): boolean {
    return !this.isFalling && !this.isFeedbackActive;
  }

  /** Вызывается перед запуском анимации падения. */
  startFall(): void {
    this.isFalling = true;
  }

  /** Завершает состояние падения. */
  endFall(): void {
    this.isFalling = false;
  }

  /**
   * Подставляет нужный визуальный префаб под данные тайла.
   * Старый визуальный узел удаляется, затем инстанцируется новый в visualRoot.
   * При наличии {@link TileAppearanceConfig.spawnFx} воспроизводится VFX.
   */
  apply(tile: Tile): void {
    this.tile = tile;

    // 1. Выбираем нужный префаб по color/kind
    let prefab: cc.Prefab | undefined;
    if (tile.kind === TileKind.Normal) {
      const idx = this.colorIndex(tile.color);
      prefab = this.normalVariants[idx];
    } else {
      const variants = this.superVariants || [];
      prefab = variants[tile.kind];
    }
    if (!prefab) return;

    // 2. Удаляем предыдущую визуализацию
    if (this.currentVisual) {
      // В тестовой среде destroy может отсутствовать
      const maybe = this.currentVisual as unknown as { destroy?: () => void };
      if (typeof maybe.destroy === "function") {
        maybe.destroy();
      }
      this.currentVisual = null;
    }

    // 3. Инстанцируем новую и помещаем в visualRoot
    const node = cc.instantiate(prefab);
    node.parent = this.visualRoot;
    this.currentVisual = node;
    // node.setPosition(node.width / 2, -node.height / 2);
    // this.node.setAnchorPoint(cc.v2(0, 1));

    // 4. Читаем конфиг визуального префаба и запускаем эффекты
    const cfg = node.getComponent(TileAppearanceConfig);
    if (cfg) {
      this.activateFx = cfg.activateFx;
      if (cfg.spawnFx) {
        const fx = cc.instantiate(cfg.spawnFx);
        fx.parent = this.node;
      }
    } else {
      this.activateFx = null;
    }
  }

  /**
   * Активирует супер‑тайл, запуская эффект из {@link TileAppearanceConfig}.
   */
  activateSuper(): void {
    if (this.activateFx) {
      const fx = cc.instantiate(this.activateFx);
      // Position effect relative to tiles layer so it persists after tile node is destroyed
      fx.parent = this.node.parent || this.node;
      fx.setPosition(this.node.position);
    }
    // Дополнительная индикация может быть добавлена здесь
  }

  /** Анимация отклика на нажатие. */
  pressFeedback(): void {
    this.isFeedbackActive = true;
    const target = this.node;
    // const width = (target as unknown as { width?: number }).width ?? 0;
    // const height = (target as unknown as { height?: number }).height ?? 0;

    // // determine current pos/anchor and convert to default top-left origin
    // const getPos =
    //   (target as unknown as { getPosition?: () => cc.Vec2 }).getPosition?.bind(
    //     target,
    //   ) || (() => (target as unknown as { position: cc.Vec2 }).position);
    // const getAnchor =
    //   (
    //     target as unknown as { getAnchorPoint?: () => cc.Vec2 }
    //   ).getAnchorPoint?.bind(target) || (() => cc.v2(0, 1));

    // const curPos: cc.Vec2 = getPos();
    // const curAnchor: cc.Vec2 = getAnchor();

    const defaultAnchor = cc.v2(0, 1);
    // const basePos = cc.v2(
    //   curPos.x + width * (curAnchor.x - defaultAnchor.x),
    //   curPos.y + height * (curAnchor.y - defaultAnchor.y),
    // );

    // const centerOffset = cc.v2(
    //   width * (0.5 - defaultAnchor.x),
    //   height * (0.5 - defaultAnchor.y),
    // );
    // const centerPos = cc.v2(
    //   basePos.x + centerOffset.x,
    //   basePos.y + centerOffset.y,
    // );

    const maybe = target as unknown as {
      stopAllActions?: () => void;
      setScale?: (x: number, y?: number) => void;
    };
    if (typeof maybe.stopAllActions === "function") maybe.stopAllActions();
    if (typeof maybe.setScale === "function") maybe.setScale(1, 1);

    // target.setAnchorPoint(cc.v2(0.5, 0.5));
    // target.setPosition(centerPos);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target.runAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cc.sequence as any)(
        cc.scaleTo(0.08, 0.9),
        cc.scaleTo(0.1, 1.0),
        cc.callFunc(() => {
          target.setAnchorPoint(defaultAnchor);
          // target.setPosition(basePos);
          this.isFeedbackActive = false;
        }),
      ),
    );
  }

  /** Возвращает индекс цвета в массиве нормальных вариантов. */
  private colorIndex(color: TileColor): number {
    const order: TileColor[] = ["red", "blue", "green", "yellow", "purple"];
    const idx = order.indexOf(color);
    return idx >= 0 ? idx : 0;
  }
}
