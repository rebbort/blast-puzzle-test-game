const { ccclass, property } = cc._decorator;

/**
 * Component that plays a VFX prefab and resolves when it finishes.
 */
@ccclass()
export class VfxInstance extends cc.Component {
  @property([cc.ParticleSystem])
  particleSystems: cc.ParticleSystem[] = [];

  @property([cc.Animation])
  animations: cc.Animation[] = [];

  @property([cc.Component])
  extras: cc.Component[] = [];

  /**
   * Starts configured effects and resolves once all of them finish.
   */
  play(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const ps of this.particleSystems) {
      if (!ps) continue;
      // prevent auto removal so we can destroy node ourselves
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (ps as unknown as { autoRemoveOnFinish?: boolean }).autoRemoveOnFinish =
        false;
      promises.push(
        new Promise<void>((resolve) => {
          const target =
            typeof (ps as unknown as { once?: unknown }).once === "function"
              ? (ps as unknown as {
                  once: (event: string, cb: () => void) => void;
                })
              : ps.node;
          target.once("finished", resolve);
          ps.resetSystem();
        }),
      );
    }

    for (const anim of this.animations) {
      if (!anim) continue;
      promises.push(
        new Promise<void>((resolve) => {
          anim.once("finished", resolve);
          anim.play();
        }),
      );
    }

    for (const extra of this.extras) {
      if (!extra) continue;
      const anyExtra = extra as unknown as {
        play?: () => Promise<void> | void;
        once?: (event: string, cb: () => void) => void;
      };
      if (typeof anyExtra.play === "function") {
        const result = anyExtra.play();
        promises.push(Promise.resolve(result));
      } else if (typeof anyExtra.once === "function") {
        promises.push(
          new Promise<void>((resolve) => {
            anyExtra.once!("finished", resolve);
          }),
        );
      }
    }

    if (promises.length === 0) {
      this.node.destroy();
      return Promise.resolve();
    }

    return Promise.all(promises).then(() => {
      this.node.destroy();
    });
  }
}

export default VfxInstance;
