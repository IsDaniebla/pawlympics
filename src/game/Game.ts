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
    private colorChangeDuration: number = 800;
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
    private readonly INITIAL_HURDLE_X: number = 600;
    private readonly DOG_X: number = 150;
    private hurdleSpeed: number = 0;
    private baseHurdleSpeed: number = 0;
    private readonly SPEED_MULTIPLIER: number = 2.5;
    private lastUpdateTime: number | null = null;
    private isTrafficLightStopped: boolean = false;
    private hasClickedThisHurdle: boolean = false;
    private trainerName: string = 'Angel';
    private trafficLightY: number = 0;
    private trafficLightBaseY: number = 0;
    private trafficLightAmplitude: number = 10;
    private trafficLightFrequency: number = 0.002;
    private trafficLightWingAngle: number = 0;
    private trafficLightWingSpeed: number = 0.1;
    private readonly TRAFFIC_LIGHT_X: number = 105;
    private readonly TRAFFIC_LIGHT_CLOUD_INDEX: number = 0;
    private readonly JUMP_DETECTION_DISTANCE: number = 100;
    private readonly JUMP_LANDING_OFFSET: number = 25;
    private isFailedJump: boolean = false;
    private readonly MIN_FLOWERS: number = 30;
    private readonly FLOWER_SPACING: number = 50;
    private isTransitioning: boolean = false;
    private nextHurdleReady: boolean = false;
    private readonly TRANSITION_SPEED: number = 3;
    private hurdleReturnStartX: number = 0;
    private hurdleReturnDistance: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.boundKeydownHandler = this.handleKeydown.bind(this);
        this.boundClickHandler = this.handleClick.bind(this);
        this.trafficLightBaseY = this.canvas.height - 300;
        this.trafficLightY = this.trafficLightBaseY;
        this.initializeClouds();
        this.initializeGrassAndFlowers();
        this.initializeGame();
    }

    public setTrainerName(name: string) {
        this.trainerName = name;
        this.initializeGame();
    }

    public setTotalHurdles(count: number) {
        this.totalHurdles = count;
        this.initializeGame();
    }

    private initializeClouds() {
        this.clouds = [];
        // Agregar la nube principal para el semáforo
        this.clouds.push({
            x: this.TRAFFIC_LIGHT_X,
            y: this.trafficLightBaseY - 100,
            width: 80
        });
        // Agregar nubes adicionales
        for (let i = 0; i < 4; i++) {
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
        
        // Distribuir flores por todo el canvas desde el inicio
        for (let x = 0; x < this.canvas.width + 100; x += 30) {
            this.flowers.push({
                x: x,
                y: this.canvas.height - 90 + Math.random() * 20,
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                size: Math.random() * 3 + 2
            });
        }

        // Añadir flores adicionales para más densidad
        for (let i = 0; i < 15; i++) {
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
        this.isFailedJump = false;
        this.isTransitioning = false;
        this.nextHurdleReady = false;
        this.trafficLightColors = ['red'];
        this.currentColorIndex = 0;
        this.lastColorChangeTime = 0;
        this.terrainOffset = 0;
        this.showHurdle = false;
        this.isTrafficLightStopped = false;
        this.hasClickedThisHurdle = false;

        // Reinicializar elementos del juego
        this.generateColorSequence();
        this.dog = new Dog(this.DOG_X, this.canvas.height - 100);
        this.createNewHurdle();
        this.initializeGrassAndFlowers();
        
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
        this.dog.reset(this.dog.getX());
        this.isTransitioning = true;
        this.nextHurdleReady = false;
        this.isJumping = false;
        this.isTrafficLightStopped = false;
        this.hasClickedThisHurdle = false;
        this.isFailedJump = false;
        this.generateColorSequence();
        this.currentColorIndex = 0;
        this.lastColorChangeTime = performance.now();
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
        const cloudX = this.clouds[this.TRAFFIC_LIGHT_CLOUD_INDEX].x - (this.terrainOffset * 0.3);
        const cloudY = this.clouds[this.TRAFFIC_LIGHT_CLOUD_INDEX].y;

        // Función para dibujar un ala con plumas
        const drawWing = (isLeft: boolean) => {
            const baseX = this.TRAFFIC_LIGHT_X + (isLeft ? -25 : 25);
            const baseY = this.trafficLightY + 20;
            const wingSpread = 60;
            const numFeathers = 10;
            
            this.ctx.save();
            this.ctx.translate(baseX, baseY);
            
            // Ángulo base para el movimiento
            const baseAngle = Math.sin(this.trafficLightWingAngle) * 0.3 * (isLeft ? -1 : 1);
            
            // Dibujar cada pluma
            for (let i = 0; i < numFeathers; i++) {
                const featherLength = wingSpread - (i * 3);
                const featherWidth = 6;
                const angleSpread = Math.PI / 2.5;
                const featherAngle = (i / (numFeathers - 1)) * angleSpread;
                const finalAngle = isLeft ? 
                    Math.PI + featherAngle + baseAngle : 
                    -featherAngle + baseAngle;

                this.ctx.save();
                this.ctx.rotate(finalAngle);
                
                // Dibujar la pluma
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                // Crear una forma de pluma curva más pronunciada
                this.ctx.quadraticCurveTo(
                    featherLength * 0.6,
                    featherWidth * 1.2,
                    featherLength,
                    0
                );
                this.ctx.quadraticCurveTo(
                    featherLength * 0.6,
                    -featherWidth * 1.2,
                    0,
                    0
                );
                this.ctx.fill();

                // Agregar un sutil efecto de sombreado
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
                
                this.ctx.restore();
            }
            
            this.ctx.restore();
        };

        // Dibujar ambas alas
        drawWing(true);  // Ala izquierda
        drawWing(false); // Ala derecha

        // Dibujar la caja del semáforo
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.TRAFFIC_LIGHT_X - 20, this.trafficLightY, 40, 80);

        // Dibujar la conexión entre los círculos
        this.ctx.fillStyle = '#333333'; // Color más claro que el negro para la conexión
        this.ctx.beginPath();
        this.ctx.moveTo(this.TRAFFIC_LIGHT_X - 5, this.trafficLightY + 25);
        this.ctx.lineTo(this.TRAFFIC_LIGHT_X + 5, this.trafficLightY + 25);
        this.ctx.lineTo(this.TRAFFIC_LIGHT_X + 5, this.trafficLightY + 55);
        this.ctx.lineTo(this.TRAFFIC_LIGHT_X - 5, this.trafficLightY + 55);
        this.ctx.closePath();
        this.ctx.fill();

        // Dibujar los círculos
        // Círculo superior (siempre apagado)
        this.ctx.fillStyle = '#440000'; // Rojo oscuro para indicar que está apagado
        this.ctx.beginPath();
        this.ctx.arc(this.TRAFFIC_LIGHT_X, this.trafficLightY + 20, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Círculo inferior (luz actual)
        this.ctx.fillStyle = this.trafficLightColors[this.currentColorIndex];
        this.ctx.beginPath();
        this.ctx.arc(this.TRAFFIC_LIGHT_X, this.trafficLightY + 60, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Agregar efecto de brillo a los círculos
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(this.TRAFFIC_LIGHT_X - 5, this.trafficLightY + 15, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.TRAFFIC_LIGHT_X - 5, this.trafficLightY + 55, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    private updateTrafficLight(currentTime: number) {
        if (this.gameOver || this.isTrafficLightStopped) return;

        if (!this.lastColorChangeTime) {
            this.lastColorChangeTime = currentTime;
        }

        if (currentTime - this.lastColorChangeTime >= this.colorChangeDuration) {
            if (this.currentColorIndex < this.trafficLightColors.length - 1) {
                this.currentColorIndex++;
                this.lastColorChangeTime = currentTime;
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
        const flowerColors = ['#FF69B4', '#FFB6C1', '#FFA07A', '#98FB98', '#87CEEB', '#DDA0DD'];
        
        for (const flower of this.flowers) {
            let adjustedX = flower.x - this.terrainOffset;
            
            // Si la flor sale por la izquierda, reposicionarla a la derecha
            if (adjustedX < -20) {
                flower.x += this.canvas.width + 40;
                flower.y = this.canvas.height - 90 + Math.random() * 20;
                flower.color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                flower.size = Math.random() * 3 + 2;
                adjustedX = flower.x - this.terrainOffset;
            }
            
            // Asegurarse de que siempre haya suficientes flores
            if (this.flowers.length < this.MIN_FLOWERS) {
                this.flowers.push({
                    x: this.canvas.width + Math.random() * 200,
                    y: this.canvas.height - 90 + Math.random() * 20,
                    color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                    size: Math.random() * 3 + 2
                });
            }
            
            // Tallo de la flor
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(adjustedX, flower.y);
            this.ctx.lineTo(adjustedX, flower.y - 35);
            this.ctx.stroke();

            // Pétalos
            this.ctx.fillStyle = flower.color;
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const petalX = adjustedX + Math.cos(angle) * flower.size;
                const petalY = flower.y - 35 + Math.sin(angle) * flower.size;
                
                this.ctx.beginPath();
                this.ctx.arc(petalX, petalY, flower.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Centro de la flor
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(adjustedX, flower.y - 35, flower.size * 0.5, 0, Math.PI * 2);
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

    private updateGameInfo() {
        const currentHurdleElement = document.getElementById('currentHurdle');
        const successfulHurdlesElement = document.getElementById('successfulHurdles');
        const scoreElement = document.getElementById('score');

        if (currentHurdleElement) {
            currentHurdleElement.textContent = `${this.currentHurdle}/${this.totalHurdles}`;
        }
        if (successfulHurdlesElement) {
            successfulHurdlesElement.textContent = this.successfulHurdles.toString();
        }
        if (scoreElement) {
            scoreElement.textContent = this.score.toString();
        }
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

        // Dibujar la valla
        this.hurdle.draw(this.ctx);

        // Actualizar la información del juego en los paneles HTML
        this.updateGameInfo();

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
        } else if (!this.hasClickedThisHurdle) {
            // Detener el semáforo en el color actual y acelerar la valla
            this.isTrafficLightStopped = true;
            this.hasClickedThisHurdle = true;
            this.hurdleSpeed = this.baseHurdleSpeed * this.SPEED_MULTIPLIER;
        }
        // Prevenir comportamientos por defecto
        e.preventDefault();
    }

    private handleKeydown(e: KeyboardEvent) {
        // Evitar que el evento se procese múltiples veces
        if (e.repeat) return;

        if (e.code === 'Space' && this.gameOver) {
            this.initializeGame();
            // Prevenir el comportamiento por defecto del espacio
            e.preventDefault();
        }
    }

    private update() {
        if (!this.gameOver) { 
            const currentTime = performance.now();
            const deltaTime = this.lastUpdateTime ? currentTime - this.lastUpdateTime : 0;
            this.lastUpdateTime = currentTime;

            this.dog.update();
            
            // Solo actualizar el terreno y la valla si el perro no está en recuperación
            if (!this.dog.isInRecovery()) {
                this.updateHurdlePosition(deltaTime);
                this.terrainOffset += this.terrainSpeed;
            }
            
            this.updateTrafficLight(currentTime);
            this.updateTrafficLightPosition(currentTime);
        }
    }

    private checkCollision() {
        const dogX = this.dog.getX();
        const hurdleX = this.hurdle.getX();
        
        if (Math.abs(dogX - hurdleX) < 30) {
            if (!this.isJumping) {
                this.dog.failJump(hurdleX);
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
        if (this.isTransitioning && this.nextHurdleReady) {
            // Durante la transición, crear la valla en el lado derecho
            this.hurdle = new Hurdle(this.canvas.width + 50, this.canvas.height - 90);
        } else {
            // Para la primera valla o al iniciar el juego, usar la posición inicial
            this.hurdle = new Hurdle(this.INITIAL_HURDLE_X, this.canvas.height - 90);
        }
        
        // Calcular la velocidad base basada en la duración del semáforo y la distancia
        const totalDistance = this.INITIAL_HURDLE_X - this.DOG_X;
        const totalTime = this.colorChangeDuration * this.trafficLightColors.length;
        this.baseHurdleSpeed = totalDistance / totalTime;
        
        // Si estamos en transición y es la nueva valla, usar la velocidad base
        if (this.isTransitioning && this.nextHurdleReady) {
            this.hurdleSpeed = this.baseHurdleSpeed;
        } else {
            this.hurdleSpeed = this.baseHurdleSpeed;
        }
    }

    private updateHurdlePosition(deltaTime: number) {
        if (this.gameOver) return;

        const currentX = this.hurdle.getX();
        let newX = currentX;

        if (this.isTransitioning) {
            if (!this.nextHurdleReady) {
                newX = currentX - (this.hurdleSpeed * deltaTime);
                
                if (newX < -100) {
                    this.createNewHurdle();
                    this.nextHurdleReady = true;
                }
            } else {
                newX = currentX - (this.baseHurdleSpeed * deltaTime);
                
                if (newX <= this.INITIAL_HURDLE_X) {
                    this.isTransitioning = false;
                    newX = this.INITIAL_HURDLE_X;
                }
            }
        } else if (!this.isFailedJump) {
            // Mover la valla cuando el perro está caminando (no en recuperación)
            if (!this.dog.isInRecovery()) {
                newX = currentX - (this.hurdleSpeed * deltaTime);
            }
            
            if (!this.isJumping && !this.dog.isInRecovery() && Math.abs(newX - this.DOG_X) < this.JUMP_DETECTION_DISTANCE) {
                this.evaluateJump();
            }
        }

        this.hurdle.setX(newX);
    }

    private evaluateJump() {
        if (this.gameOver || this.isJumping || this.dog.isInRecovery()) return;

        this.isJumping = true;
        const hurdleX = this.hurdle.getX();

        if (!this.hasClickedThisHurdle) {
            // Si no ha hecho clic, es un fallo automático
            this.dog.failJump(hurdleX + this.JUMP_LANDING_OFFSET);
            this.isFailedJump = true;
            this.handleFailedJump();
            return;
        }

        // Evaluar el salto basado en el color actual
        const currentColor = this.trafficLightColors[this.currentColorIndex];
        const isSuccessfulJump = currentColor === 'green' || 
                                currentColor === 'yellow' || 
                                currentColor === 'orange';

        if (isSuccessfulJump) {
            if (currentColor === 'green') {
                this.dog.perfectJump(hurdleX + this.JUMP_LANDING_OFFSET);
                this.score += 15;
            } else if (currentColor === 'yellow') {
                this.dog.normalJump(hurdleX + this.JUMP_LANDING_OFFSET);
                this.score += 10;
            } else if (currentColor === 'orange') {
                this.dog.normalJump(hurdleX + this.JUMP_LANDING_OFFSET);
                this.score += 5;
            }
            this.successfulHurdles++;
            this.handleJumpResult(true);
        } else {
            this.dog.failJump(hurdleX + this.JUMP_LANDING_OFFSET);
            this.isFailedJump = true;
            this.handleFailedJump();
        }
    }

    private handleFailedJump() {
        const checkRecovery = () => {
            if (this.dog.isInRecovery()) {
                setTimeout(checkRecovery, 100);
            } else {
                if (this.currentHurdle >= this.totalHurdles) {
                    this.gameOver = true;
                } else {
                    // Cuando el perro se recupera, todo vuelve a moverse
                    this.nextHurdle();
                }
            }
        };
        
        setTimeout(checkRecovery, 500);
    }

    private handleJumpResult(isSuccess: boolean) {
        if (!isSuccess) {
            this.handleFailedJump();
            return;
        }

        setTimeout(() => {
            if (this.currentHurdle >= this.totalHurdles) {
                this.gameOver = true;
            } else {
                this.nextHurdle();
            }
        }, 1000);
    }

    private updateTrafficLightPosition(currentTime: number) {
        // Actualizar la posición vertical del semáforo
        this.trafficLightY = this.trafficLightBaseY + 
            Math.sin(currentTime * this.trafficLightFrequency) * this.trafficLightAmplitude;
        
        // Actualizar el ángulo de las alas
        this.trafficLightWingAngle += this.trafficLightWingSpeed;
        if (this.trafficLightWingAngle >= Math.PI * 2) {
            this.trafficLightWingAngle = 0;
        }
    }
}