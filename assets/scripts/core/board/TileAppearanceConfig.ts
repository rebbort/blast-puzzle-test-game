const { ccclass, property } = cc._decorator;

import { TileKind } from "./Tile";
import { FXController } from "../fx/FXController";

/**
 * Метаданные для визуального префаба тайла.
 * Указывает, к какому kind относится и какие визуальные эффекты проигрывать.
 */

@ccclass("TileAppearanceConfig")
export class TileAppearanceConfig extends cc.Component {
  /** Тип супер-тайла (или Normal для обычного). */
  private static readonly ccEnum = (
    cc as unknown as { Enum?: (e: object) => unknown }
  ).Enum;
  @property({
    type: TileAppearanceConfig.ccEnum
      ? TileAppearanceConfig.ccEnum(TileKind)
      : TileKind,
  })
  kind: TileKind = TileKind.Normal;

  /**
   * Префаб визуального эффекта, который воспроизводится при появлении
   * данного тайла.
   */
  @property(cc.Prefab)
  spawnFx: cc.Prefab | null = null;

  /**
   * Префаб визуального эффекта, который воспроизводится при активации
   * (например, когда срабатывает супер‑тайл).
   */
  @property(cc.Prefab)
  activateFx: cc.Prefab | null = null;

  // Дополнительные параметры могут быть добавлены здесь (цветовые вспышки,
  // множители и т. д.)

  onLoad(): void {
    if (this.activateFx) {
      FXController.setPrefab(this.kind, this.activateFx);
    }
  }
}
