import { Dog } from "./Dog";
import { Hurdle } from "./Hurdle";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dog: Dog = new Dog(50, 0);
    private hurdle: Hurdle = new Hurdle(0, 0);
    private score: number = 0;
    private isJumping: boolean = false;
    private totalHurdles: number = 5;
    private currentHurdle: number = 1;
    private gameOver: boolean = false;
    private boundKeydownHandler: (e: KeyboardEvent) => void;
    private boundClickHandler: (e: MouseEvent) => void;
    private gameLoopId: number | null = null;
    private trafficLightColors: string[] = ['red'];
    private currentColorIndex: number = 0;
    private lastColorChangeTime: number = 0;
    private colorChangeDuration: number = 1000;
    private canJump: boolean = false;
    private terrainOffset: number = 0;
    private readonly terrainSpeed: number = 2;
    private clouds: Array<{x: number, y: number, width: number}> = [];
    private grass: Array<{x: number, y: number, height: number}> = [];
    private flowers: Array<{x: number, y: number, color: string, size: number}> = [];
    private successfulHurdles: number = 0;
    private colorPoints = {
        'red': 0,
        'yellow': 10,
        'orange': 5,
        'green': 15
    };
    private showHurdle: boolean = false;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.boundKeydownHandler = this.handleKeydown.bind(this);
        this.boundClickHandler = this.handleClick.bind(this);
        this.initializeClouds();
        this.initializeGrassAndFlowers();
        this.initializeGame();
    }

    private initializeClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 100 + 20,
                width: Math.random() * 100 + 50
            });
        }
    }

    private initializeGrassAndFlowers() {
        // Inicializar hierba
        this.grass = [];
        for (let x = 0; x < this.canvas.width; x += 5) {
            this.grass.push({
                x,
                y: this.canvas.height - 90,
                height: Math.random() * 15 + 5
            });
        }

        // Inicializar flores
        this.flowers = [];
        const flowerColors = ['#FF69B4', '#FFB6C1', '#FFA07A', '#98FB98', '#87CEEB', '#DDA0DD'];
        for (let i = 0; i < 30; i++) {
            this.flowers.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height - 90 + Math.random() * 20,
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                size: Math.random() * 3 + 2
            });
        }
    }

    private cleanup() {
        document.removeEventListener('keydown', this.boundKeydownHandler);
        this.canvas.removeEventListener('click', this.boundClickHandler);
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    private initializeGame() {
        this.cleanup();

        // Reiniciar todas las variables del juego
        this.score = 0;
        this.currentHurdle = 1;
        this.successfulHurdles = 0;
        this.gameOver = false;
        this.isJumping = false;
        this.trafficLightColors = ['red'];
        this.currentColorIndex = 0;
        this.lastColorChangeTime = 0;
        this.canJump = false;
        this.terrainOffset = 0;
        this.showHurdle = false;

        // Reiniciar elementos del juego
        this.generateColorSequence();
        this.dog = new Dog(100, this.canvas.height - 100);
        this.createNewHurdle();
        
        // Agregar los event listeners
        document.addEventListener('keydown', this.boundKeydownHandler);
        this.canvas.addEventListener('click', this.boundClickHandler);

        this.startGame();
    }

    private generateColorSequence() {
        // Comenzar con rojo
        this.trafficLightColors = ['red'];
        
        // Crear array de colores intermedios
        const middleColors = ['yellow', 'orange', 'green'];
        
        // Mezclar los colores intermedios
        for (let i = middleColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [middleColors[i], middleColors[j]] = [middleColors[j], middleColors[i]];
        }
        
        // Agregar los colores mezclados y el rojo final
        this.trafficLightColors = this.trafficLightColors.concat(middleColors, ['red']);
    }

    private nextHurdle() {
        if (this.currentHurdle >= this.totalHurdles) {
            this.gameOver = true;
            return;
        }
        
        this.currentHurdle++;
        this.dog.reset(50);
        this.createNewHurdle();
        this.isJumping = false;
        this.canJump = false;
    }

    private drawClouds() {
        this.ctx.fillStyle = 'white';
        for (const cloud of this.clouds) {
            // Ajustar la posición X con el desplazamiento más lento para las nubes
            let adjustedX = cloud.x - (this.terrainOffset * 0.3);
            
            // Si la nube sale completamente de la pantalla por la izquierda
            if (adjustedX < -cloud.width) {
                cloud.x += this.canvas.width + cloud.width + 100;
                cloud.y = Math.random() * 100 + 20; // Variar la altura al reaparecer
                adjustedX = cloud.x - (this.terrainOffset * 0.3);
            }

            // Dibujar la nube usando formas suaves
            this.ctx.beginPath();
            this.ctx.arc(adjustedX, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.arc(adjustedX + cloud.width * 0.2, cloud.y - 10, cloud.width * 0.25, 0, Math.PI * 2);
            this.ctx.arc(adjustedX + cloud.width * 0.4, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.arc(adjustedX + cloud.width * 0.2, cloud.y + 10, cloud.width * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    private drawPath() {
        const pathY = this.canvas.height - 90;
        
        // Fondo del camino (pavimento gris oscuro)
        this.ctx.fillStyle = '#404040';
        this.ctx.fillRect(0, pathY, this.canvas.width, 40);
        
        // Líneas blancas del camino
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        
        // Dibujar líneas discontinuas con movimiento
        const lineLength = 30;
        const lineGap = 40;
        const totalLength = lineLength + lineGap;
        
        // Asegurarse de que siempre haya suficientes líneas visibles
        for (let x = -totalLength + (this.terrainOffset % totalLength); x < this.canvas.width + totalLength; x += totalLength) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, pathY + 20);
            this.ctx.lineTo(x + lineLength, pathY + 20);
            this.ctx.stroke();
        }
    }

    private drawTrafficLight() {
        // Dibujar el poste del semáforo
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(100, this.canvas.height - 300, 10, 200); // Poste más alto

        // Dibujar la caja del semáforo
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(85, this.canvas.height - 300, 40, 80);

        // Dibujar la luz actual
        this.ctx.fillStyle = this.trafficLightColors[this.currentColorIndex];
        this.ctx.beginPath();
        this.ctx.arc(105, this.canvas.height - 260, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private updateTrafficLight(currentTime: number) {
        if (this.isJumping || this.gameOver) return;

        if (!this.lastColorChangeTime) {
            this.lastColorChangeTime = currentTime;
        }

        if (currentTime - this.lastColorChangeTime >= this.colorChangeDuration) {
            if (this.currentColorIndex < this.trafficLightColors.length - 1) {
                this.currentColorIndex++;
                this.lastColorChangeTime = currentTime;

                // Habilitar el salto en verde, amarillo y naranja
                const currentColor = this.trafficLightColors[this.currentColorIndex];
                this.canJump = currentColor === 'green' || 
                              currentColor === 'yellow' || 
                              currentColor === 'orange';
            } else if (!this.isJumping && !this.gameOver) {
                this.showHurdle = true;
                this.isJumping = true;
                this.dog.failJump();
                setTimeout(() => {
                    if (this.currentHurdle < this.totalHurdles) {
                        this.nextHurdle();
                        this.generateColorSequence();
                        this.currentColorIndex = 0;
                        this.lastColorChangeTime = currentTime;
                    } else {
                        this.gameOver = true;
                    }
                }, 1500);
            }
        }
    }

    private drawGrass() {
        // Fondo del césped con gradiente
        const grassGradient = this.ctx.createLinearGradient(0, this.canvas.height - 150, 0, this.canvas.height);
        grassGradient.addColorStop(0, '#90EE90');
        grassGradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, this.canvas.height - 150, this.canvas.width, 150);

        // Dibujar hierba individual
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        
        for (const blade of this.grass) {
            let adjustedX = blade.x - this.terrainOffset;
            
            if (adjustedX < -10) {
                blade.x += this.canvas.width + 20;
                adjustedX = blade.x - this.terrainOffset;
            }
            
            const waveOffset = Math.sin((blade.x + this.terrainOffset) * 0.05) * 5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(adjustedX, blade.y);
            this.ctx.quadraticCurveTo(
                adjustedX + waveOffset,
                blade.y - blade.height / 2,
                adjustedX + waveOffset,
                blade.y - blade.height
            );
            this.ctx.stroke();
        }
    }

    private drawFlowers() {
        for (const flower of this.flowers) {
            let adjustedX = flower.x - this.terrainOffset;
            
            if (adjustedX < -20) {
                flower.x += this.canvas.width + 40;
                flower.y = this.canvas.height - 90 + Math.random() * 20;
                adjustedX = flower.x - this.terrainOffset;
            }
            
            // Tallo de la flor más alto
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(adjustedX, flower.y);
            this.ctx.lineTo(adjustedX, flower.y - 35); // Aumentado de -15 a -35 para tallos más altos
            this.ctx.stroke();

            // Pétalos
            this.ctx.fillStyle = flower.color;
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const petalX = adjustedX + Math.cos(angle) * flower.size;
                const petalY = flower.y - 35 + Math.sin(angle) * flower.size; // Ajustado para la nueva altura
                
                this.ctx.beginPath();
                this.ctx.arc(petalX, petalY, flower.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Centro de la flor
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(adjustedX, flower.y - 35, flower.size * 0.5, 0, Math.PI * 2); // Ajustado para la nueva altura
            this.ctx.fill();
        }
    }

    private drawPointsInfo() {
        // Panel de información de puntos con más padding
        const panelPadding = 20;
        const panelWidth = 200;
        const panelHeight = 180; // Aumentado para más espacio
        const startX = this.canvas.width - panelWidth - 10;
        const startY = 10;

        // Fondo del panel con más padding
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(startX, startY, panelWidth, panelHeight);
        
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        
        // Título
        this.ctx.fillText('Puntos por Color:', startX + panelPadding, startY + 25);
        
        const circleRadius = 8;
        const textStartX = startX + panelPadding + 25;
        const circleStartX = startX + panelPadding;
        
        // Verde
        this.ctx.fillStyle = 'green';
        this.ctx.beginPath();
        this.ctx.arc(circleStartX + circleRadius, startY + 50, circleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('Verde: 15 pts', textStartX, startY + 55);
        
        // Amarillo
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(circleStartX + circleRadius, startY + 85, circleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('Amarillo: 10 pts', textStartX, startY + 90);
        
        // Naranja
        this.ctx.fillStyle = 'orange';
        this.ctx.beginPath();
        this.ctx.arc(circleStartX + circleRadius, startY + 120, circleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('Naranja: 5 pts', textStartX, startY + 125);
        
        // Rojo
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(circleStartX + circleRadius, startY + 155, circleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('Rojo: 0 pts', textStartX, startY + 160);
    }

    private draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar el cielo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height - 90);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E2FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 90);

        // Dibujar nubes
        this.drawClouds();

        // Dibujar el césped y flores
        this.drawGrass();
        this.drawFlowers();

        // Dibujar el camino
        this.drawPath();

        // Dibujar el semáforo
        this.drawTrafficLight();

        // Dibujar el perro
        this.dog.draw(this.ctx);

        // Dibujar la valla solo si showHurdle es true
        if (this.showHurdle) {
            this.hurdle.draw(this.ctx);
        }

        // Panel de información del juego (izquierda)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = 'black';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        
        // Mostrar información del juego
        this.ctx.fillText(`Valla: ${this.currentHurdle}/${this.totalHurdles}`, 20, 40);
        this.ctx.fillText(`Superadas: ${this.successfulHurdles}`, 20, 70);
        this.ctx.fillText(`Puntos: ${this.score}`, 20, 100);

        // Dibujar panel de información de puntos (derecha)
        this.drawPointsInfo();

        if (this.gameOver) {
            // Fondo semitransparente
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Texto de juego terminado
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Juego Terminado!', this.canvas.width/2, this.canvas.height/2 - 60);
            
            // Mostrar resultados finales
            this.ctx.font = 'bold 36px Arial';
            
            // Mensaje específico si perdió por saltar en rojo
            const currentColor = this.trafficLightColors[this.currentColorIndex];
            if (currentColor === 'red' && this.isJumping) {
                this.ctx.fillText('¡Has saltado en rojo!', this.canvas.width/2, this.canvas.height/2);
            }
            
            this.ctx.fillText(`Vallas Superadas: ${this.successfulHurdles}/${this.totalHurdles}`, this.canvas.width/2, this.canvas.height/2 + 50);
            this.ctx.fillText(`Puntuación Final: ${this.score} puntos`, this.canvas.width/2, this.canvas.height/2 + 100);
            
            // Instrucciones para reiniciar
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('Presiona ESPACIO para reiniciar', this.canvas.width/2, this.canvas.height/2 + 160);
            
            // Restablecer alineación del texto
            this.ctx.textAlign = 'left';
        }
    }

    private handleClick(e: MouseEvent) {
        if (this.gameOver) {
            this.initializeGame();
        } else if (!this.isJumping) {
            this.jump();
        }
        // Prevenir comportamientos por defecto
        e.preventDefault();
    }

    private handleKeydown(e: KeyboardEvent) {
        // Evitar que el evento se procese múltiples veces
        if (e.repeat) return;

        if (e.code === 'Space') {
            if (this.gameOver) {
                this.initializeGame();
            } else if (!this.isJumping) {
                this.jump();
            }
            // Prevenir el comportamiento por defecto del espacio
            e.preventDefault();
        }
    }

    private jump() {
        if (this.gameOver || this.currentHurdle > this.totalHurdles || this.isJumping) return;
        
        this.isJumping = true;
        this.canJump = false;
        this.showHurdle = true;
        
        // Obtener el color actual del semáforo
        const currentColor = this.trafficLightColors[this.currentColorIndex];

        if (currentColor === 'red') {
            // Si salta en rojo, el perro se cae y termina el juego después de la animación
            this.dog.failJump();
            setTimeout(() => {
                this.gameOver = true;
            }, 1000); // Esperar a que se complete la animación de caída
            return;
        }

        // Determinar si el salto es exitoso basado en el color
        const isSuccessfulJump = currentColor === 'green' || 
                                currentColor === 'yellow' || 
                                currentColor === 'orange';

        if (isSuccessfulJump) {
            // Asignar puntos según el color
            if (currentColor === 'green') {
                this.score += 15; // Más puntos por salto en verde
            } else if (currentColor === 'yellow') {
                this.score += 10; // Puntos intermedios por amarillo
            } else if (currentColor === 'orange') {
                this.score += 5; // Menos puntos por naranja
            }
            
            this.successfulHurdles++;
            this.dog.perfectJump();
        } else {
            this.dog.failJump();
        }

        setTimeout(() => {
            if (this.currentHurdle < this.totalHurdles && !this.gameOver) {
                this.nextHurdle();
                this.generateColorSequence();
                this.currentColorIndex = 0;
                this.lastColorChangeTime = performance.now();
            } else {
                this.gameOver = true;
            }
        }, 1500);
    }

    private update() {
        if (!this.gameOver) { 
            this.dog.update();
            this.checkCollision();
            // Actualizar el semáforo
            this.updateTrafficLight(performance.now());
            // Actualizar el movimiento del terreno
            this.terrainOffset += this.terrainSpeed;
        }
    }

    private checkCollision() {
        const dogX = this.dog.getX();
        const hurdleX = this.hurdle.getX();
        
        if (Math.abs(dogX - hurdleX) < 30) {
            if (!this.isJumping) {
                this.dog.failJump();
                setTimeout(() => {
                    this.nextHurdle();
                }, 1500);
            }
        }
    }

    private startGame() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }

        const gameLoop = () => {
            this.update();
            this.draw();
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        this.gameLoopId = requestAnimationFrame(gameLoop);
    }

    private createNewHurdle() {
        const hurdleX = 500;
        this.hurdle = new Hurdle(hurdleX, this.canvas.height - 120);
        this.showHurdle = false;
    }
}