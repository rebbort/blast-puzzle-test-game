const { ccclass, property } = cc._decorator;

/**
 * Контроллер для эффекта ракеты с двумя хвостами.
 * Управляет двумя частицами, которые разлетаются в противоположных направлениях.
 */
@ccclass("RocketVfxController")
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
  leftAngle: number = 135; // Влево-вверх

  @property({ type: cc.Float, range: [0, 360, 5] })
  rightAngle: number = 45; // Вправо-вверх

  @property({ type: cc.Float, range: [0, 360, 5] })
  movementAngle: number = 90; // Угол движения ноды (по умолчанию вверх)

  private isPlaying = false;

  /**
   * Запускает эффект ракеты с двумя хвостами.
   * @returns Promise, который разрешается когда эффект завершен
   */
  play(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isPlaying) {
        resolve();
        return;
      }

      this.isPlaying = true;

      // Настраиваем и запускаем левый хвост
      if (this.leftTail) {
        this.setupTail(this.leftTail, this.leftAngle);
        this.leftTail.resetSystem();
      }

      // Настраиваем и запускаем правый хвост
      if (this.rightTail) {
        this.setupTail(this.rightTail, this.rightAngle);
        this.rightTail.resetSystem();
      }

      // Анимируем движение ноды за пределы экрана
      this.animateNodeMovement();

      // Ждем завершения эффекта
      const finish = () => {
        this.isPlaying = false;
        this.node.destroy();
        resolve();
      };

      // Подписываемся на завершение обоих хвостов
      if (this.leftTail?.node) {
        this.leftTail.node.once("finished", finish);
      }
      if (this.rightTail?.node) {
        this.rightTail.node.once("finished", finish);
      }

      // Fallback: если события не сработают, завершаем через duration
      setTimeout(() => {
        if (this.isPlaying) {
          finish();
        }
      }, this.duration * 1000);
    });
  }

  /**
   * Анимирует движение нод с партиклами в разные стороны.
   */
  private animateNodeMovement(): void {
    // Получаем размеры экрана
    const visibleSize = cc.view.getVisibleSize();
    const screenWidth = visibleSize.width;
    const screenHeight = visibleSize.height;
    const distance = Math.max(screenWidth, screenHeight) * 1.5; // 1.5x размер экрана

    // Анимируем левый хвост
    if (this.leftTail?.node) {
      const leftAngleRad = (this.leftAngle * Math.PI) / 180;
      const leftDirectionX = Math.cos(leftAngleRad);
      const leftDirectionY = Math.sin(leftAngleRad);

      const leftEndX = this.leftTail.node.x + leftDirectionX * distance;
      const leftEndY = this.leftTail.node.y + leftDirectionY * distance;

      const leftMoveAction = cc.moveTo(this.duration, leftEndX, leftEndY);
      this.leftTail.node.runAction(leftMoveAction);
    }

    // Анимируем правый хвост
    if (this.rightTail?.node) {
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
   * Настраивает хвост ракеты с заданным углом.
   */
  private setupTail(particleSystem: cc.ParticleSystem, angle: number): void {
    // Отключаем автоматическое удаление
    (
      particleSystem as unknown as { autoRemoveOnFinish?: boolean }
    ).autoRemoveOnFinish = false;

    // Настраиваем параметры частиц
    particleSystem.duration = this.duration;
    particleSystem.life = this.duration * 0.8;
    particleSystem.speed = this.speed * 30; // Еще меньше скорость частиц, так как ноды движутся
    particleSystem.angle = angle;
    particleSystem.angleVar = 0; // Небольшое отклонение

    // Настраиваем размер и цвет
    particleSystem.startSize = 250;
    particleSystem.endSize = 5;
    particleSystem.startSizeVar = 5;
    particleSystem.endSizeVar = 2;

    // Настраиваем цвета (оранжево-красный хвост)
    particleSystem.startColor = cc.color(255, 200, 100, 255);
    particleSystem.endColor = cc.color(255, 100, 50, 0);
    particleSystem.startColorVar = cc.color(50, 50, 50, 50);
    particleSystem.endColorVar = cc.color(30, 30, 30, 30);

    // Настраиваем эмиссию
    particleSystem.emissionRate = 200;
    particleSystem.totalParticles = 100;

    // Настраиваем физику - убираем гравитацию для лучшего эффекта хвоста
    particleSystem.gravity = cc.v2(0, 0);
    particleSystem.tangentialAccel = 0;
    particleSystem.radialAccel = 0;
    particleSystem.speedVar = 20;

    // Настройки позиции
    particleSystem.sourcePos = cc.v2(0, 0);
    particleSystem.posVar = cc.v2(2, 2);
    particleSystem.positionType = cc.ParticleSystem.PositionType.RELATIVE; // Относительно ноды

    // Настройки вращения
    particleSystem.startSpin = 0;
    particleSystem.endSpin = 0;
    particleSystem.startSpinVar = 180;
    particleSystem.endSpinVar = 180;
    particleSystem.rotationIsDir = true;
  }

  /**
   * Останавливает эффект.
   */
  stop(): void {
    this.isPlaying = false;
    if (this.leftTail) {
      this.leftTail.stopSystem();
    }
    if (this.rightTail) {
      this.rightTail.stopSystem();
    }
  }
}

export default RocketVfxController;
