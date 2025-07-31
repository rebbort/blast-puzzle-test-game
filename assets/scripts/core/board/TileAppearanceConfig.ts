const { ccclass, property } = cc._decorator;

/**
 * Метаданные для визуального префаба тайла.
 * Указывает, к какому kind относится и какие визуальные эффекты проигрывать.
 */
export enum SuperKind {
  Normal,
  SuperRow,
  SuperCol,
  SuperBomb,
  SuperClear,
}

@ccclass("TileAppearanceConfig")
export class TileAppearanceConfig extends cc.Component {
  /** Тип супер-тайла (или Normal для обычного). */
  private static readonly ccEnum = (
    cc as unknown as { Enum?: (e: object) => unknown }
  ).Enum;
  @property({
    type: TileAppearanceConfig.ccEnum
      ? TileAppearanceConfig.ccEnum(SuperKind)
      : SuperKind,
  })
  kind: SuperKind = SuperKind.Normal;

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
}
