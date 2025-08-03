const { ccclass, property } = cc._decorator;

/**
 * Component that plays a VFX prefab and resolves when it finishes.
 */
@ccclass("VfxInstance")
export class VfxInstance extends cc.Component {
  @property(cc.ParticleSystem)
  particleSystem: cc.ParticleSystem | null = null;

  @property(cc.Animation)
  animation: cc.Animation | null = null;

  /**
   * Starts the particle system or animation and resolves once the `finished`
   * event fires.
   */
  play(): Promise<void> {
    return new Promise((resolve) => {
      const finish = () => {
        this.node.off("finished", finish);
        resolve();
      };
      this.node.once("finished", finish);
      if (this.particleSystem) {
        this.particleSystem.resetSystem();
      }
      if (this.animation) {
        this.animation.play();
      }
    });
  }
}

export default VfxInstance;
