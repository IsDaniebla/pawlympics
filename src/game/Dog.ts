export class Dog {
    private x: number;
    private y: number;
    private baseY: number;
    private jumpHeight: number = 0;
    private jumpVelocity: number = 0;
    private gravity: number = 0.5;
    private isStumbling: boolean = false;
    private rotationAngle: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseY = y;
    }

    public getX(): number {
        return this.x;
    }

    public setX(x: number): void {
        this.x = x;
    }

    public perfectJump() {
        this.jumpVelocity = -15;
        this.jumpHeight = 0;
        this.isStumbling = false;
    }

    public normalJump() {
        this.jumpVelocity = -12;
        this.jumpHeight = 0;
        this.isStumbling = false;
    }

    public failJump() {
        this.jumpVelocity = -5;
        this.jumpHeight = 0;
        this.isStumbling = true;
        this.rotationAngle = 0;
    }

    public reset(x: number) {
        this.x = x;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isStumbling = false;
        this.rotationAngle = 0;
    }

    public update() {
        // Solo actualizar la física del salto
        if (this.jumpVelocity !== 0 || this.y + this.jumpHeight < this.baseY) {
            this.jumpHeight += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            
            if (this.y + this.jumpHeight > this.baseY) {
                this.jumpHeight = this.baseY - this.y;
                this.jumpVelocity = 0;
            }
        }

        // Actualizar la animación de tropiezo
        if (this.isStumbling) {
            this.rotationAngle += 0.2;
            if (this.rotationAngle >= Math.PI / 2) {
                this.rotationAngle = Math.PI / 2;
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        // Aplicar transformaciones
        ctx.translate(this.x, this.y + this.jumpHeight);
        if (this.isStumbling) {
            ctx.rotate(this.rotationAngle);
        }

        // Dibujar el perro
        ctx.fillStyle = 'brown';
        ctx.beginPath();
        // Cuerpo
        ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeza
        ctx.fillStyle = 'brown';
        ctx.beginPath();
        ctx.ellipse(20, -10, 15, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orejas
        ctx.fillStyle = 'darkbrown';
        ctx.beginPath();
        ctx.ellipse(15, -20, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
} 