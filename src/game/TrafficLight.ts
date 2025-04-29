export class TrafficLight {
    private state: 'red' | 'yellow' | 'green' = 'red';
    private readonly size: number = 50;
    private readonly spacing: number = 10;
    private readonly totalHeight: number = (this.size + this.spacing) * 3;

    constructor(private x: number, private y: number) {}

    setState(state: 'red' | 'yellow' | 'green') {
        this.state = state;
    }

    getState(): 'red' | 'yellow' | 'green' {
        return this.state;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Dibujar el fondo del semáforo
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y, this.size + 20, this.totalHeight);

        // Dibujar las luces
        const lights = ['red', 'yellow', 'green'];
        lights.forEach((light, index) => {
            const centerX = this.x + this.size / 2 + 10;
            const centerY = this.y + (this.size + this.spacing) * index + this.size / 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size / 2 - 5, 0, Math.PI * 2);
            
            // Establecer el color basado en el estado actual
            if (light === this.state) {
                ctx.fillStyle = light;
            } else {
                ctx.fillStyle = '#444';
            }
            
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }
} 