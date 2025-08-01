const { ccclass, property } = cc._decorator;

import type { Tile, TileColor } from "../../core/board/Tile";
import { TileKind } from "../../core/board/Tile";
import { TileAppearanceConfig } from "../../core/board/TileAppearanceConfig";

/**
 * Представление игрового тайла. Содержит контейнер `visualRoot`, куда
 * подставляются разные префабы внешнего вида в зависимости от модели.
 */
@ccclass("TileView")
export default class TileView extends cc.Component {
  /** Узел, в который инстанцируются визуальные варианты тайла. */
  @property(cc.Node)
  visualRoot!: cc.Node;

  /** Префабы обычных тайлов (по цветам). Порядок соответствует перечислению цветов. */
  @property([cc.Prefab])
  normalVariants: cc.Prefab[] = [];

  /** Префабы супер‑тайлов по индексу {@link SuperKind}. */
  @property([cc.Prefab])
  superVariants: cc.Prefab[] = [];

  /** Текущий визуальный узел, размещённый в visualRoot. */
  private currentVisual: cc.Node | null = null;

  /** Префаб эффекта активации, взятый из {@link TileAppearanceConfig}. */
  private activateFx: cc.Prefab | null = null;

  /** Кэш модели тайла для возможных обновлений. */
  public tile!: Tile;

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
      prefab = this.superVariants[tile.kind];
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
    node.setPosition(node.width / 2, -node.height / 2);

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
      fx.parent = this.node;
    }
    // Дополнительная индикация может быть добавлена здесь
  }

  /** Анимация отклика на нажатие. */
  pressFeedback(): void {
    const target = this.node;
    // cc.Node in tests lacks getPosition, fallback to position field
    const prevPos =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (target as any).getPosition === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).getPosition()
        : target.position;
    const prevAnchor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (target as any).getAnchorPoint === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any).getAnchorPoint()
        : cc.v2(0, 1);
    const width = (target as unknown as { width?: number }).width ?? 0;
    const height = (target as unknown as { height?: number }).height ?? 0;

    const offset = cc.v2(
      width * (0.5 - prevAnchor.x),
      height * (0.5 - prevAnchor.y),
    );
    target.setAnchorPoint(cc.v2(0.5, 0.5));
    target.setPosition(prevPos.x + offset.x, prevPos.y + offset.y);

    const maybe = target as unknown as { stopAllActions?: () => void };
    if (typeof maybe.stopAllActions === "function") maybe.stopAllActions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target.runAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cc.sequence as any)(
        cc.scaleTo(0.08, 0.9),
        cc.scaleTo(0.1, 1.0),
        cc.callFunc(() => {
          target.setAnchorPoint(prevAnchor);
          target.setPosition(prevPos);
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
