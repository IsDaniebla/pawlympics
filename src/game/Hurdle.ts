export class Hurdle {
    private x: number;
    private y: number;
    private height: number = 40; // Reducida la altura general
    private width: number = 10;
    private readonly postColor: string = '#8B4513'; // Marrón para los postes
    private readonly barColor: string = '#CD853F'; // Marrón más claro para la barra
    private readonly metalColor: string = '#C0C0C0'; // Plateado para detalles metálicos
    private readonly perspective: number = 0.45; // Aumentada la perspectiva para más inclinación

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y + 25; // Aumentamos el desplazamiento vertical a 25
    }

    public getX(): number {
        return this.x;
    }

    public setX(x: number): void {
        this.x = x;
    }

    private drawPost(ctx: CanvasRenderingContext2D, x: number, isBack: boolean) {
        const perspectiveOffset = isBack ? -12 : 0;
        const heightAdjust = isBack ? -8 : 0;
        
        // Base del poste (reducida)
        ctx.fillStyle = this.postColor;
        ctx.beginPath();
        ctx.moveTo(x - 5, this.y); // Reducido el ancho del poste
        ctx.lineTo(x + 5, this.y);
        ctx.lineTo(x + 4, this.y - 6);
        ctx.lineTo(x - 4, this.y - 6);
        ctx.closePath();
        ctx.fill();

        // Poste principal con gradiente (reducido)
        const gradient = ctx.createLinearGradient(
            x - 4, 
            this.y - this.height + perspectiveOffset, 
            x + 4, 
            this.y - this.height + perspectiveOffset
        );
        gradient.addColorStop(0, this.postColor);
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, this.postColor);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - 4, this.y - 6);
        ctx.lineTo(x + 4, this.y - 6);
        ctx.lineTo(x + 2, this.y - this.height + heightAdjust + perspectiveOffset);
        ctx.lineTo(x - 2, this.y - this.height + heightAdjust + perspectiveOffset);
        ctx.closePath();
        ctx.fill();

        // Detalles metálicos (reducidos)
        ctx.fillStyle = this.metalColor;
        ctx.fillRect(
            x - 4, 
            this.y - this.height + 4 + heightAdjust + perspectiveOffset, 
            8, 
            2
        );
        ctx.fillRect(
            x - 4, 
            this.y - 10, 
            8, 
            2
        );
    }

    public draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        this.drawPost(ctx, this.x - 15, true);
        this.drawPost(ctx, this.x + 15, false);

        // Barra horizontal con perspectiva
        const barGradient = ctx.createLinearGradient(
            this.x - 15, // Ajustado para alinear con el poste izquierdo
            this.y - this.height - 12,
            this.x + 15, // Ajustado para alinear con el poste derecho
            this.y - this.height
        );
        barGradient.addColorStop(0, this.barColor);
        barGradient.addColorStop(0.5, '#DEB887');
        barGradient.addColorStop(1, this.barColor);

        ctx.fillStyle = barGradient;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.height - 10); // Alineado con poste izquierdo
        ctx.lineTo(this.x + 15, this.y - this.height); // Alineado con poste derecho
        ctx.lineTo(this.x + 15, this.y - this.height + 8);
        ctx.lineTo(this.x - 15, this.y - this.height);
        ctx.closePath();
        ctx.fill();

        // Detalles metálicos en la barra (reducidos)
        ctx.fillStyle = this.metalColor;
        for (let i = -15; i <= 15; i += 30) { // Ajustado para solo los extremos
            const yOffset = (i + 15) * this.perspective;
            ctx.beginPath();
            ctx.arc(
                this.x + i, 
                this.y - this.height + 2 - yOffset, 
                1.5, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();

        // Reflejos con perspectiva
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - this.height - 8); // Alineado con poste izquierdo
        ctx.lineTo(this.x + 15, this.y - this.height + 1); // Alineado con poste derecho
        ctx.stroke();

        // Sombras en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(this.x - 15, this.y + 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
} 