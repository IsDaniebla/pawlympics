export class Dog {
    private x: number;
    private y: number;


    private jumpHeight: number = 0;
    private jumpVelocity: number = 0;


    private isStumbling: boolean = false;
    private rotationAngle: number = 0;
    private tailWag: number = 0;
    private earWiggle: number = 0;
    private legPhase: number = 0;
    private eyeBlink: number = 0;
    private isBlinking: boolean = false;
    private blinkTimer: number = 0;
    private tongueOut: number = 0;

    private isJumping: boolean = false;
    private targetX: number = 0;
    private jumpStartX: number = 0;
    private jumpProgress: number = 0;
    private jumpDuration: number = 40; // Reducida aún más la duración del salto
    private recoveryTimer: number = 0;
    private isRecovering: boolean = false;
    private readonly RECOVERY_DELAY: number = 30;
    private readonly RECOVERY_DURATION: number = 45;
    private isReturning: boolean = false;
    private returnSpeed: number = 2; // Reducido de 3 a 2
    private readonly MAX_RETURN_SPEED: number = 4; // Reducido de 6 a 4
    private targetReturnX: number = 0;
    private readonly INITIAL_X: number = 150;
    private readonly BODY_WIDTH: number = 30;
    private readonly BODY_HEIGHT: number = 20;

    constructor(x: number, y: number) {
        this.x = x;

        this.y = y;

        this.INITIAL_X = x; // Guardar la posición inicial
    }

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y + this.jumpHeight;
    }

    public setX(x: number): void {
        this.x = x;

    }

    private startJump(verticalVelocity: number, targetX: number) {
        this.jumpVelocity = verticalVelocity;
        this.jumpHeight = 0;
        this.isJumping = true;
        this.jumpStartX = this.x;
        this.targetX = targetX;
        this.jumpProgress = 0;
    }

    public perfectJump(hurdleX: number) {
        this.startJump(-15, hurdleX);
        this.isStumbling = false;

        this.tongueOut = 1;
        setTimeout(() => {
            this.startReturn();
        }, this.jumpDuration * 16);
    }

    public normalJump(hurdleX: number) {
        this.startJump(-12, hurdleX);
        this.isStumbling = false;

        setTimeout(() => {
            this.startReturn();
        }, this.jumpDuration * 16);
    }

    public failJump(hurdleX: number) {
        this.startJump(-5, hurdleX + 100);
        this.isStumbling = true;
        this.rotationAngle = 0;

        this.recoveryTimer = 0;
        this.isRecovering = false;
        this.isReturning = false;
    }

    public reset(x: number) {
        this.x = x;

        this.jumpHeight = 0;
        this.jumpVelocity = 0;

        this.isStumbling = false;
        this.rotationAngle = 0;

        this.isJumping = false;
        this.jumpProgress = 0;
        this.recoveryTimer = 0;
        this.isRecovering = false;
    }

    private drawLeg(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Pata superior
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, 0, 6, 15);

        // Pata inferior
        ctx.translate(0, 15);
        ctx.rotate(Math.PI / 8);
        ctx.fillRect(-3, 0, 6, 10);

        // Pie
        ctx.translate(0, 10);
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    public update() {
        if (this.isJumping) {
            this.jumpProgress++;

            const progress = this.jumpProgress / this.jumpDuration;
            const jumpDistance = this.targetX - this.jumpStartX;

            this.x = this.jumpStartX + (jumpDistance * progress);

            const verticalProgress = progress * 2 - 1;
            this.jumpHeight = -75 * (1 - (verticalProgress * verticalProgress));

            if (this.jumpProgress >= this.jumpDuration) {
                this.isJumping = false;
                this.jumpHeight = 0;
                this.x = this.targetX;

            }
        }

        // Manejar el retorno gradual a la posición original
        if (this.isReturning) {
            const distanceToTarget = this.targetReturnX - this.x;
            if (Math.abs(distanceToTarget) > this.returnSpeed) {
                this.x += Math.sign(distanceToTarget) * this.returnSpeed;

                // Aumentar la velocidad de movimiento de las patas durante el retorno
                this.legPhase += 0.4;
            } else {
                this.x = this.targetReturnX;

                this.isReturning = false;

            }
        }

        if (this.isStumbling) {
            if (!this.isRecovering) {
                this.rotationAngle += 0.2;
                if (this.rotationAngle >= Math.PI / 2) {
                    this.rotationAngle = Math.PI / 2;
                    this.recoveryTimer++;

                    if (this.recoveryTimer >= this.RECOVERY_DELAY) {
                        this.isRecovering = true;
                        this.recoveryTimer = 0;
                    }
                }
            } else {
                this.recoveryTimer++;
                const recoveryProgress = this.recoveryTimer / this.RECOVERY_DURATION;
                this.rotationAngle = Math.PI / 2 * (1 - recoveryProgress);

                if (this.recoveryTimer >= this.RECOVERY_DURATION) {
                    this.isStumbling = false;
                    this.isRecovering = false;
                    this.rotationAngle = 0;

                    this.startReturn();
                }
            }
        }

        // Actualizar animaciones
        if (!this.isStumbling) {
            this.tailWag += 0.2;
            this.earWiggle += 0.1;
            if (!this.isReturning) {
                this.legPhase += 0.3;
            }
        }

        // Parpadeo aleatorio
        this.blinkTimer++;
        if (this.blinkTimer > 100 && Math.random() < 0.02) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }
        if (this.isBlinking) {
            this.eyeBlink += 0.5;
            if (this.eyeBlink >= Math.PI) {
                this.eyeBlink = 0;
                this.isBlinking = false;
            }
        }

        if (this.tongueOut > 0) {
            this.tongueOut -= 0.01;
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // Aplicar transformaciones base
        ctx.translate(this.x, this.y + this.jumpHeight);
        if (this.isStumbling) {
            ctx.rotate(this.rotationAngle);
        }

        // Cola
        ctx.save();
        ctx.translate(-25, 0);
        // Ajustar el movimiento de la cola según el estado
        const tailWagAmount = this.isStumbling ? 0.2 : (this.tongueOut > 0 ? 0.8 : 0.5);
        ctx.rotate(Math.sin(this.tailWag) * tailWagAmount);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(-15, -15, -20, -5);
        ctx.quadraticCurveTo(-15, 5, 0, 5);
        ctx.fill();
        ctx.restore();

        // Patas
        const legMovement = this.calculateLegMovement();
        this.drawLeg(ctx, -15, 15, legMovement.frontLeft);
        this.drawLeg(ctx, 15, 15, legMovement.frontRight);
        this.drawLeg(ctx, -5, 15, legMovement.backLeft);
        this.drawLeg(ctx, 20, 15, legMovement.backRight);

        // Cuerpo principal - siempre mantiene su forma
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.BODY_WIDTH, this.BODY_HEIGHT, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sombra del cuerpo
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 15, 25, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Manchas
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(10, -5, 8, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Cabeza con movimiento más sutil
        ctx.save();
        // Ajustar el movimiento de la cabeza según el estado
        const headBobAmount = this.isStumbling ?
            0 :
            (this.jumpVelocity !== 0 ? Math.sin(this.legPhase * 0.5) * 2 : 0);
        const headTiltAmount = this.isStumbling ? -0.2 : (this.tongueOut > 0 ? 0.1 : 0);
        ctx.translate(20, -15 + headBobAmount);
        ctx.rotate(headTiltAmount);

        // Orejas con movimiento más sutil
        ctx.save();
        const earWiggleAmount = this.isStumbling ? 0 : Math.sin(this.earWiggle) * 0.1;

        // Oreja izquierda
        ctx.rotate(-0.2 + earWiggleAmount);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-8, -8, 6, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Oreja derecha
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.ellipse(8, -8, 6, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Cara
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hocico
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(8, 2, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nariz
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(15, 0, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ojos - ajustar expresión según el estado
        const eyeOpenness = this.isBlinking ? Math.sin(this.eyeBlink) : 1;
        const eyeSize = this.isStumbling ? 2 : 3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-5, -5, eyeSize, eyeSize * eyeOpenness, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -5, eyeSize, eyeSize * eyeOpenness, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lengua (cuando está feliz)
        if (this.tongueOut > 0) {
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.moveTo(12, 5);
            const tongueLength = 10 * this.tongueOut;
            ctx.quadraticCurveTo(12 + tongueLength / 2, 10, 12 + tongueLength, 5);
            ctx.quadraticCurveTo(12 + tongueLength / 2, 8, 12, 5);
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
    }

    private calculateLegMovement() {
        if (this.isStumbling) {
            if (!this.isRecovering) {
                // Durante la caída, las patas se mueven hacia arriba gradualmente
                const fallProgress = this.rotationAngle / (Math.PI / 2);
                return {
                    frontLeft: -Math.PI / 4 * fallProgress,
                    frontRight: Math.PI / 4 * fallProgress,
                    backLeft: -Math.PI / 3 * fallProgress,
                    backRight: Math.PI / 3 * fallProgress
                };
            } else {
                // Durante la recuperación, las patas vuelven a su posición normal con un ligero movimiento

                const walkPhase = Math.sin(this.legPhase) * 0.2;
                return {
                    frontLeft: walkPhase,
                    frontRight: -walkPhase,
                    backLeft: -walkPhase,
                    backRight: walkPhase
                };
            }
        } else if (this.isJumping) {
            // Durante el salto
            return {
                frontLeft: Math.PI / 6,
                frontRight: -Math.PI / 6,
                backLeft: -Math.PI / 6,
                backRight: Math.PI / 6
            };
        } else {
            // Movimiento normal de caminata
            const baseMovement = Math.sin(this.legPhase) * 0.3;
            return {
                frontLeft: baseMovement,
                frontRight: -baseMovement,
                backLeft: -baseMovement,
                backRight: baseMovement
            };
        }
    }

    public setReturnSpeed(speed: number) {
        this.returnSpeed = Math.min(speed, this.MAX_RETURN_SPEED);
    }

    private startReturn() {
        this.isReturning = true;
        this.targetReturnX = this.INITIAL_X;

        this.returnSpeed = this.MAX_RETURN_SPEED;
    }

    public isInReturnState(): boolean {
        return this.isReturning;
    }

    public getReturnSpeed(): number {
        return this.returnSpeed;
    }

    public hasReturnedToStart(): boolean {
        return !this.isReturning && this.x === this.INITIAL_X;
    }

    public isInRecovery(): boolean {
        return this.isStumbling || this.isRecovering;
    }

    public getBounds(): { x: number, y: number, width: number, height: number } {
        return {
            x: this.x - this.BODY_WIDTH * 1.5,
            y: this.y + this.jumpHeight - this.BODY_HEIGHT * 1.5,
            width: this.BODY_WIDTH * 3,
            height: this.BODY_HEIGHT * 3
        };
    }
} 