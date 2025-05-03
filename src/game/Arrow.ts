export class Arrow {
    private x: number;
    private y: number;
    private initialX: number;
    private initialY: number;
    private targetX: number;
    private targetY: number;
    private speed: number;
    private time: number = 0;
    private readonly ARROW_LENGTH: number = 25;
    private readonly ARROW_WIDTH: number = 3;
    private angle: number = 0;
    private readonly GRAVITY: number = 0.15;
    private velocityX: number = 0;
    private velocityY: number = 0;
    private readonly MAX_TIME: number = 150;
    private isDirectShot: boolean = false;

    constructor(x: number, y: number, speed: number, targetX: number, targetY: number, isDirectShot: boolean = false) {
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.speed = speed;
        this.targetX = targetX;
        this.targetY = targetY;
        this.isDirectShot = isDirectShot;
        
        if (this.isDirectShot) {
            // Cálculo para tiro directo
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.angle = Math.atan2(dy, dx);
            
            // Velocidades constantes para tiro directo
            this.velocityX = (dx / distance) * this.speed;
            this.velocityY = (dy / distance) * this.speed;
        } else {
            // Cálculo para tiro parabólico
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.angle = Math.atan2(dy, dx);
            
            // Ajustar velocidades para crear una parábola más plana
            this.velocityX = Math.cos(this.angle) * this.speed * 1.2;
            this.velocityY = Math.sin(this.angle) * this.speed - this.GRAVITY * 5;
        }
    }

    public update(): void {
        this.time++;
        
        if (this.isDirectShot) {
            // Movimiento lineal para tiro directo
            this.x += this.velocityX;
            this.y += this.velocityY;
            // El ángulo se mantiene constante en tiro directo
        } else {
            // Movimiento parabólico para tiro normal
            this.x = this.initialX + this.velocityX * this.time;
            this.y = this.initialY + this.velocityY * this.time + 0.5 * this.GRAVITY * this.time * this.time;
            
            // Actualizar ángulo de la flecha para que siga la trayectoria
            this.angle = Math.atan2(
                this.velocityY + this.GRAVITY * this.time,
                this.velocityX
            );
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Dibujar la flecha de arco
        // Punta de la flecha
        ctx.fillStyle = '#4a2810';
        ctx.beginPath();
        ctx.moveTo(this.ARROW_LENGTH, 0);
        ctx.lineTo(this.ARROW_LENGTH - 10, -this.ARROW_WIDTH);
        ctx.lineTo(this.ARROW_LENGTH - 10, this.ARROW_WIDTH);
        ctx.closePath();
        ctx.fill();

        // Cuerpo de la flecha (madera)
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-this.ARROW_LENGTH + 10, -1, this.ARROW_LENGTH * 2 - 10, 2);

        // Plumas de la flecha
        ctx.fillStyle = '#f8f8ff';
        // Pluma superior
        ctx.beginPath();
        ctx.moveTo(-this.ARROW_LENGTH + 5, 0);
        ctx.lineTo(-this.ARROW_LENGTH + 15, -4);
        ctx.lineTo(-this.ARROW_LENGTH + 5, -1);
        ctx.closePath();
        ctx.fill();
        // Pluma inferior
        ctx.beginPath();
        ctx.moveTo(-this.ARROW_LENGTH + 5, 0);
        ctx.lineTo(-this.ARROW_LENGTH + 15, 4);
        ctx.lineTo(-this.ARROW_LENGTH + 5, 1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    public getPosition(): { x: number, y: number } {
        return { x: this.x, y: this.y };
    }

    public getBounds(): { x: number, y: number, width: number, height: number } {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const width = Math.abs(this.ARROW_LENGTH * cos) + Math.abs(this.ARROW_WIDTH * sin);
        const height = Math.abs(this.ARROW_LENGTH * sin) + Math.abs(this.ARROW_WIDTH * cos);
        
        return {
            x: this.x - width/2,
            y: this.y - height/2,
            width: width,
            height: height
        };
    }

    public setSpeed(newSpeed: number): void {
        const speedRatio = newSpeed / this.speed;
        this.speed = newSpeed;
        this.velocityX *= speedRatio;
        this.velocityY *= speedRatio;
    }

    public isExpired(): boolean {
        return this.time >= this.MAX_TIME;
    }
} 