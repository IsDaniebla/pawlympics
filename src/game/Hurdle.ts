export class Hurdle {
    private x: number;
    private y: number;
    private height: number = 60;
    private width: number = 10;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public getX(): number {
        return this.x;
    }

    public setX(x: number): void {
        this.x = x;
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        // Postes verticales
        ctx.fillRect(this.x - 15, this.y - this.height, this.width, this.height);
        ctx.fillRect(this.x + 5, this.y - this.height, this.width, this.height);
        // Barra horizontal
        ctx.fillRect(this.x - 20, this.y - this.height, 40, 5);
    }
} 