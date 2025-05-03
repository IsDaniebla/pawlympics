interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    life: number;
    maxLife: number;
    landed: boolean;
    finalRotation: number;
}

export class Effects {
    private particles: Particle[] = [];
    private readonly gravity: number = 0.15;
    private canvas: HTMLCanvasElement | null = null;
    private landedParticles: Particle[] = [];
    private isGameOver: boolean = false;

    public setGameOver(isGameOver: boolean) {
        this.isGameOver = isGameOver;
        if (!isGameOver) {
            // Limpiar las partículas acumuladas cuando el juego se reinicia
            this.landedParticles = [];
        }
    }

    public createSuccessEffect(x: number, y: number) {
        // Estrellas y brillos para salto exitoso
        const colors = ['#FFD700', '#FFF8DC', '#FFFACD', '#FFFF00'];
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                alpha: 1,
                size: 3 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: 60,
                maxLife: 60,
                landed: false,
                finalRotation: Math.random() * Math.PI * 2
            });
        }
    }

    public createFailEffect(x: number, y: number) {
        // Nubes de polvo y pequeñas piedras para caída
        const colors = ['#8B4513', '#A0522D', '#6B4423', '#8B7355'];
        for (let i = 0; i < 20; i++) {
            const angle = Math.PI + Math.random() * Math.PI;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                alpha: 0.8,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                life: 45,
                maxLife: 45,
                landed: false,
                finalRotation: Math.random() * Math.PI * 2
            });
        }
    }

    public createGameOverEffect() {
        if (!this.canvas) return;

        // Colores vibrantes para el confeti
        const colors = [
            '#FF69B4', // Rosa
            '#87CEEB', // Azul cielo
            '#98FB98', // Verde claro
            '#DDA0DD', // Violeta
            '#F0E68C', // Amarillo
            '#FF6B6B', // Rojo coral
            '#4ECDC4', // Turquesa
            '#FFD93D'  // Amarillo dorado
        ];

        // Crear confeti desde la parte superior
        const numParticles = 3; // Menos partículas por iteración para mejor visibilidad
        for (let i = 0; i < numParticles; i++) {
            const startX = Math.random() * this.canvas.width;
            const startY = -this.canvas.height * 0.2; // Comenzar más arriba de la pantalla
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.createConfettiParticle(startX, startY, color);
        }
    }

    private createConfettiParticle(x: number, y: number, color: string) {
        const particle: Particle = {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.5, // Reducido de 2 a 0.5 para movimiento más vertical
            vy: 1, // Velocidad inicial vertical constante
            alpha: 1,
            size: 8 + Math.random() * 4,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1, // Reducida la velocidad de rotación
            life: Infinity,
            maxLife: Infinity,
            landed: false,
            finalRotation: Math.random() * Math.PI * 2
        };
        
        this.particles.push(particle);
    }

    public update() {
        if (!this.canvas) return;
        const floorY = this.canvas.height - 20;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!particle.landed) {
                // Actualizar posición
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Aplicar gravedad
                particle.vy += this.gravity;
                
                // Limitar velocidad máxima
                if (particle.vy > 4) particle.vy = 4;
                
                // Efecto de oscilación muy suave
                particle.vx += Math.sin(Date.now() * 0.001) * 0.01;
                
                // Actualizar rotación
                particle.rotation += particle.rotationSpeed;
                
                // Rebotar en los bordes laterales con menos energía
                if (particle.x < 0 || particle.x > this.canvas.width) {
                    particle.vx *= -0.5;
                }
                
                // Comprobar si ha llegado al suelo
                if (particle.y >= floorY) {
                    if (this.isGameOver) {
                        // Durante el game over, acumular las partículas
                        particle.y = floorY;
                        particle.landed = true;
                        particle.rotation = particle.finalRotation;
                        this.landedParticles.push(particle);
                    }
                    // Eliminar la partícula de las activas
                    this.particles.splice(i, 1);
                }
            }
        }

        // Limitar el número de partículas acumuladas solo durante el game over
        if (this.isGameOver && this.landedParticles.length > 100) {
            this.landedParticles.splice(0, this.landedParticles.length - 100);
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        this.canvas = ctx.canvas;
        ctx.save();

        // Dibujar primero las partículas acumuladas
        for (const particle of this.landedParticles) {
            this.drawConfettiParticle(ctx, particle);
        }

        // Dibujar las partículas que están cayendo
        for (const particle of this.particles) {
            this.drawConfettiParticle(ctx, particle);
        }

        ctx.restore();
    }

    private drawConfettiParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        // Dibujar el confeti
        const width = particle.size;
        const height = particle.size / 3;
        
        // Crear gradiente
        const gradient = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, this.adjustColor(particle.color, -20));
        ctx.fillStyle = gradient;
        
        // Dibujar la forma principal
        ctx.fillRect(-width/2, -height/2, width, height);
        
        // Añadir brillo
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-width/2, -height/2, width/4, height);
        
        ctx.restore();
    }

    private adjustColor(color: string, amount: number): string {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    public clearAllParticles() {
        this.particles = [];
        this.landedParticles = [];
    }
} 