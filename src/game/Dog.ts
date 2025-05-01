export class Dog {
    private x: number;
    private y: number;
    private baseY: number;
    private baseX: number;
    private jumpHeight: number = 0;
    private jumpVelocity: number = 0;
    private horizontalVelocity: number = 0;
    private gravity: number = 0.5;
    private isStumbling: boolean = false;
    private rotationAngle: number = 0;
    private tailWag: number = 0;
    private earWiggle: number = 0;
    private legPhase: number = 0;
    private eyeBlink: number = 0;
    private isBlinking: boolean = false;
    private blinkTimer: number = 0;
    private tongueOut: number = 0;
    private happiness: number = 1;
    private isJumping: boolean = false;
    private targetX: number = 0;
    private jumpStartX: number = 0;
    private jumpProgress: number = 0;
    private jumpDuration: number = 60; // Aumentada la duración del salto

    constructor(x: number, y: number) {
        this.x = x;
        this.baseX = x;
        this.y = y;
        this.baseY = y;
    }

    public getX(): number {
        return this.x;
    }

    public setX(x: number): void {
        this.x = x;
        this.baseX = x;
    }

    private startJump(verticalVelocity: number, hurdleX: number) {
        this.jumpVelocity = verticalVelocity;
        this.jumpHeight = 0;
        this.isJumping = true;
        this.jumpStartX = this.x;
        this.targetX = hurdleX;
        this.jumpProgress = 0;
    }

    public perfectJump(hurdleX: number) {
        this.startJump(-15, hurdleX);
        this.isStumbling = false;
        this.happiness = 1.5;
        this.tongueOut = 1;
    }

    public normalJump(hurdleX: number) {
        this.startJump(-12, hurdleX);
        this.isStumbling = false;
        this.happiness = 1.2;
    }

    public failJump(hurdleX: number) {
        this.startJump(-5, hurdleX);
        this.isStumbling = true;
        this.rotationAngle = 0;
        this.happiness = 0.7;
    }

    public reset(x: number) {
        this.x = x;
        this.baseX = x;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.horizontalVelocity = 0;
        this.isStumbling = false;
        this.rotationAngle = 0;
        this.happiness = 1;
        this.isJumping = false;
        this.jumpProgress = 0;
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
            
            // Calcular la posición en la parábola
            const progress = this.jumpProgress / this.jumpDuration;
            const jumpDistance = this.targetX - this.jumpStartX;
            
            // Movimiento horizontal
            this.x = this.jumpStartX + (jumpDistance * progress);
            
            // Movimiento vertical (parábola más alta)
            const verticalProgress = progress * 2 - 1; // -1 a 1
            this.jumpHeight = -90 * (1 - (verticalProgress * verticalProgress)); // Aumentada la altura máxima de -70 a -90
            
            // Verificar si el salto ha terminado
            if (this.jumpProgress >= this.jumpDuration) {
                this.isJumping = false;
                this.jumpHeight = 0;
                this.x = this.targetX;
            }
        }

        // Actualizar animaciones con movimientos más sutiles
        this.tailWag += 0.2;
        this.earWiggle += 0.1;
        this.legPhase += 0.3;
        
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

        // Actualizar lengua con movimiento más suave
        if (this.tongueOut > 0) {
            this.tongueOut -= 0.01;
        }

        // Actualizar tropiezo
        if (this.isStumbling) {
            this.rotationAngle += 0.2;
            if (this.rotationAngle >= Math.PI / 2) {
                this.rotationAngle = Math.PI / 2;
            }
        }

        // Normalizar felicidad más suavemente
        if (this.happiness > 1) this.happiness -= 0.005;
        if (this.happiness < 1) this.happiness += 0.005;
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
        ctx.rotate(Math.sin(this.tailWag) * 0.5);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(-15, -15, -20, -5);
        ctx.quadraticCurveTo(-15, 5, 0, 5);
        ctx.fill();
        ctx.restore();

        // Patas
        if (!this.isStumbling) {
            const legMovement = this.jumpVelocity === 0 ? Math.sin(this.legPhase) * 0.3 : Math.PI / 6;
            this.drawLeg(ctx, -15, 15, legMovement);
            this.drawLeg(ctx, 15, 15, -legMovement);
            this.drawLeg(ctx, -5, 15, -legMovement);
            this.drawLeg(ctx, 20, 15, legMovement);
        }

        // Cuerpo
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 20 * this.happiness, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sombra del cuerpo para suavizar la conexión con las patas
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 15, 25, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Manchas (opcional)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(10, -5, 8, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeza con movimiento más sutil
        ctx.save();
        // Agregar un ligero movimiento de cabeza basado en el salto
        const headBobAmount = this.jumpVelocity !== 0 ? Math.sin(this.legPhase * 0.5) * 2 : 0;
        ctx.translate(20, -15 + headBobAmount);
        
        // Orejas con movimiento más sutil
        ctx.save();
        const earWiggleAmount = Math.sin(this.earWiggle) * 0.1;
        
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

        // Ojos
        const eyeOpenness = this.isBlinking ? Math.sin(this.eyeBlink) : 1;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(-5, -5, 3, 3 * eyeOpenness, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -5, 3, 3 * eyeOpenness, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lengua (cuando está feliz)
        if (this.tongueOut > 0) {
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.moveTo(12, 5);
            const tongueLength = 10 * this.tongueOut;
            ctx.quadraticCurveTo(12 + tongueLength/2, 10, 12 + tongueLength, 5);
            ctx.quadraticCurveTo(12 + tongueLength/2, 8, 12, 5);
            ctx.fill();
        }

        ctx.restore();
        ctx.restore();
    }
} 