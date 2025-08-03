const { ccclass, property } = cc._decorator;

/**
 * Controller for the rocket effect with two tails.
 * Manages two particles that fly in opposite directions.
 */
@ccclass()
export class RocketVfxController extends cc.Component {
  @property(cc.ParticleSystem)
  leftTail: cc.ParticleSystem | null = null;

  @property(cc.ParticleSystem)
  rightTail: cc.ParticleSystem | null = null;

  @property({ type: cc.Float, range: [0.5, 3.0, 0.1] })
  speed: number = 1.5;

  @property({ type: cc.Float, range: [0.5, 2.0, 0.1] })
  duration: number = 1.0;

  @property({ type: cc.Float, range: [0, 360, 5] })
  leftAngle: number = 135; // Left-up

  @property({ type: cc.Float, range: [0, 360, 5] })
  rightAngle: number = 45; // Right-up

  @property({ type: cc.Float, range: [0, 360, 5] })
  movementAngle: number = 90; // Node movement angle (default up)

  private isPlaying = false;

  /**
   * Starts the rocket effect with two tails.
   * @returns Promise that resolves when the effect is finished
   */
  play(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isPlaying) {
        resolve();
        return;
      }

      if (!this.node || !cc.isValid(this.node)) {
        console.warn("Node is null or invalid");
        resolve();
        return;
      }

      this.isPlaying = true;

      // Configure and start the left tail
      if (this.leftTail) {
        this.setupTail(this.leftTail, this.leftAngle);
        this.leftTail.resetSystem();
      }

      // Configure and start the right tail
      if (this.rightTail) {
        this.setupTail(this.rightTail, this.rightAngle);
        this.rightTail.resetSystem();
      }

      // Animate the node movement beyond the screen
      this.animateNodeMovement();

      // Wait for the effect to finish
      const finish = () => {
        this.isPlaying = false;
        if (this.node && cc.isValid(this.node)) {
          this.node.destroy();
        }
        resolve();
      };

      // Subscribe to the completion of both tails
      if (this.leftTail?.node && cc.isValid(this.leftTail.node)) {
        this.leftTail.node.once("finished", finish);
      }
      if (this.rightTail?.node && cc.isValid(this.rightTail.node)) {
        this.rightTail.node.once("finished", finish);
      }

      // Fallback: if the events don't work, finish through duration
      setTimeout(() => {
        if (this.isPlaying) {
          finish();
        }
      }, this.duration * 1000);
    });
  }

  /**
   * Animates the node with particles in different directions.
   */
  private animateNodeMovement(): void {
    // Get the screen size
    const visibleSize = cc.view.getVisibleSize();
    const screenWidth = visibleSize.width;
    const screenHeight = visibleSize.height;
    const distance = Math.max(screenWidth, screenHeight) * 1.5; // 1.5x screen size

    // Animate the left tail
    if (this.leftTail?.node && cc.isValid(this.leftTail.node)) {
      const leftAngleRad = (this.leftAngle * Math.PI) / 180;
      const leftDirectionX = Math.cos(leftAngleRad);
      const leftDirectionY = Math.sin(leftAngleRad);

      const leftEndX = this.leftTail.node.x + leftDirectionX * distance;
      const leftEndY = this.leftTail.node.y + leftDirectionY * distance;

      const leftMoveAction = cc.moveTo(this.duration, leftEndX, leftEndY);
      this.leftTail.node.runAction(leftMoveAction);
    }

    // Animate the right tail
    if (this.rightTail?.node && cc.isValid(this.rightTail.node)) {
      const rightAngleRad = (this.rightAngle * Math.PI) / 180;
      const rightDirectionX = Math.cos(rightAngleRad);
      const rightDirectionY = Math.sin(rightAngleRad);

      const rightEndX = this.rightTail.node.x + rightDirectionX * distance;
      const rightEndY = this.rightTail.node.y + rightDirectionY * distance;

      const rightMoveAction = cc.moveTo(this.duration, rightEndX, rightEndY);
      this.rightTail.node.runAction(rightMoveAction);
    }
  }

  /**
   * Configures the rocket tail with a given angle.
   */
  private setupTail(particleSystem: cc.ParticleSystem, angle: number): void {
    if (!particleSystem || !cc.isValid(particleSystem)) {
      console.warn("ParticleSystem is null or invalid");
      return;
    }

    // Disable automatic removal
    (
      particleSystem as unknown as { autoRemoveOnFinish?: boolean }
    ).autoRemoveOnFinish = false;

    // Configure particle parameters
    particleSystem.duration = this.duration;
    particleSystem.life = this.duration * 0.8;
    particleSystem.speed = this.speed * 30; // Even less particle speed because nodes move
    particleSystem.angle = angle;
    particleSystem.angleVar = 0; // Small deviation

    // Configure size and color
    particleSystem.startSize = 250;
    particleSystem.endSize = 5;
    particleSystem.startSizeVar = 5;
    particleSystem.endSizeVar = 2;

    // Configure colors (orange-red tail)
    particleSystem.startColor = cc.color(255, 200, 100, 255);
    particleSystem.endColor = cc.color(255, 100, 50, 0);
    particleSystem.startColorVar = cc.color(50, 50, 50, 50);
    particleSystem.endColorVar = cc.color(30, 30, 30, 30);

    // Configure emission
    particleSystem.emissionRate = 200;
    particleSystem.totalParticles = 100;

    // Configure physics - remove gravity for better tail effect
    particleSystem.gravity = cc.v2(0, 0);
    particleSystem.tangentialAccel = 0;
    particleSystem.radialAccel = 0;
    particleSystem.speedVar = 20;

    // Position settings
    particleSystem.sourcePos = cc.v2(0, 0);
    particleSystem.posVar = cc.v2(2, 2);
    particleSystem.positionType = cc.ParticleSystem.PositionType.RELATIVE; // Relative to the node

    // Rotation settings
    particleSystem.startSpin = 0;
    particleSystem.endSpin = 0;
    particleSystem.startSpinVar = 180;
    particleSystem.endSpinVar = 180;
    particleSystem.rotationIsDir = true;
  }

  /**
   * Stops the effect.
   */
  stop(): void {
    this.isPlaying = false;
    if (this.leftTail && cc.isValid(this.leftTail)) {
      this.leftTail.stopSystem();
    }
    if (this.rightTail && cc.isValid(this.rightTail)) {
      this.rightTail.stopSystem();
    }
  }
}

export default RocketVfxController;
