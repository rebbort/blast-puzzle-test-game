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
      const ps = this.particleSystem;
      const psNode = ps?.node || null;
      const finish = () => {
        psNode?.off("finished", finish);
        this.animation?.off("finished", finish);
        this.node.destroy();
        resolve();
      };

      let started = false;

      if (ps && psNode) {
        psNode.once("finished", finish);
        ps.resetSystem();
        started = true;
      }

      if (this.animation) {
        this.animation.once("finished", finish);
        this.animation.play();
        started = true;
      }

      if (!started) {
        this.node.destroy();
        resolve();
      }
    });
  }
}

export default VfxInstance;
