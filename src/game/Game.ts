import { Dog } from "./Dog";
import { Hurdle } from "./Hurdle";
import { Effects } from "./Effects";
import { SoundEffects } from "./SoundEffects";
import { ScoreSystem } from "./ScoreSystem";
import { Arrow } from "./Arrow";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dog: Dog;
    private hurdle: Hurdle;
    private effects: Effects;
    private soundEffects: SoundEffects;
    private score: number = 0;
    private isJumping: boolean = false;
    private totalHurdles: number = 5;
    private currentHurdle: number = 1;
    private gameOver: boolean = false;
    private gameOverStartTime: number = 0;
    private readonly CONFETTI_DURATION: number = 4000; // 4 segundos en milisegundos
    private boundKeydownHandler: (e: KeyboardEvent) => void;
    private boundClickHandler: (e: MouseEvent) => void;
    private gameLoopId: number | null = null;
    private trafficLightColors: string[] = ['red'];
    private currentColorIndex: number = 0;
    private lastColorChangeTime: number = 0;
    private colorChangeDuration: number = 800;
    private terrainOffset: number = 0;
    private terrainSpeed: number = 2;
    private clouds: Array<{ x: number, y: number, width: number }> = [];
    private grass: Array<{ x: number, y: number, height: number }> = [];
    private flowers: Array<{ x: number, y: number, color: string, size: number }> = [];
    private successfulHurdles: number = 0;

    private readonly INITIAL_HURDLE_X: number = 600;
    private readonly DOG_X: number = 150;

    private isTrafficLightStopped: boolean = false;
    private hasClickedThisHurdle: boolean = false;
    private trafficLightY: number = 0;
    private trafficLightBaseY: number = 0;
    private trafficLightAmplitude: number = 10;
    private trafficLightFrequency: number = 0.002;
    private trafficLightWingAngle: number = 0;
    private trafficLightWingSpeed: number = 0.1;
    private readonly TRAFFIC_LIGHT_X: number = 105;

    private readonly JUMP_DETECTION_DISTANCE: number = 100;
    private readonly JUMP_LANDING_OFFSET: number = 25;

    private readonly MIN_FLOWERS: number = 30;
    private isTransitioning: boolean = false;
    private nextHurdleReady: boolean = false;
    private readonly BASE_TERRAIN_SPEED: number = 2;
    private readonly ACCELERATED_SPEED_MULTIPLIER: number = 2;
    private backgroundMusic: HTMLAudioElement | null = null;
    private isMusicPlaying: boolean = false;
    private isMusicLoaded: boolean = false;
    private isMuted: boolean = false;
    private previousVolume: number = 0.3;
    private muteButton: HTMLButtonElement;
    private volumeSlider: HTMLInputElement;
    private scoreSystem: ScoreSystem;
    private playerName: string = 'Invitado';
    private arrows: Arrow[] = [];
    private readonly VERTICAL_ARROW_POSITIONS: number[] = [
        50, 150, 250, 350, 450,  // Lado izquierdo
        550, 650, 750, 850,      // Centro
        500, 600, 700, 800, 900  // Lado derecho
    ];
    private readonly HORIZONTAL_ARROW_POSITIONS: number[] = [
        30, 60, 90, 120,         // Parte superior
        150, 180, 210            // Parte media-superior
    ];
    private readonly ARROW_SPAWN_RATE: number = 100;
    private arrowSpawnCounter: number = 0;
    private readonly ARROW_SPEED: number = 7;
    private readonly HORIZONTAL_ARROW_SPEED: number = 9;
    private arrowCounter: number = 0;
    private readonly MAX_ARROWS: number = 10;
    private allArrowPositions: { x: number, y: number, isVertical: boolean }[] = [];
    private readonly SHIELD_RADIUS: number = 60;
    private readonly SHIELD_COLLISION_RADIUS: number = 65; // Radio de colisión ligeramente mayor
    private readonly SHIELD_ARC: number = Math.PI * 0.4; // El arco del escudo cubre 72 grados
    private readonly SHIELD_COLLISION_ARC: number = Math.PI * 0.5; // Arco de colisión ligeramente mayor (90 grados)
    private mouseX: number = 0;
    private mouseY: number = 0;
    private shieldAngle: number = Math.PI; // Ángulo inicial del escudo (180 grados)
    private isInDemoMode: boolean = false;

    
    private readonly BUTTON_HEIGHT = 30;
    private readonly BUTTON_FONT = '16px Arial';
    private buttons: {
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        action: () => void;
    }[] = [];

    constructor(canvasId: string, scoreSystem: ScoreSystem) {
        this.scoreSystem = scoreSystem;
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.boundKeydownHandler = this.handleKeydown.bind(this);
        this.boundClickHandler = this.handleClick.bind(this);
        this.trafficLightBaseY = this.canvas.height - 300;
        this.trafficLightY = this.trafficLightBaseY;
        this.dog = new Dog(this.DOG_X, this.canvas.height - 100);
        this.hurdle = new Hurdle(this.INITIAL_HURDLE_X, this.canvas.height - 90);
        this.effects = new Effects();
        this.soundEffects = new SoundEffects();

        this.muteButton = document.getElementById('muteButton') as HTMLButtonElement;
        this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;

        this.initializeAudioControls();
        this.initializeBackgroundMusic();
        this.initializeClouds();
        this.initializeGrassAndFlowers();
        this.initializeGame();

        // Eventos táctiles para móviles
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Eventos de mouse para desktop
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Inicializar los botones
        this.initializeButtons();
    }

    public setTotalHurdles(count: number) {
        this.totalHurdles = count;
    }

    public restart() {
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
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
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
        this.effects.setGameOver(false);
        this.gameOverStartTime = 0;
        this.isJumping = false;

        // Mostrar el joystick al iniciar o reiniciar el juego
        const showJoystickEvent = new CustomEvent('showJoystick');
        document.dispatchEvent(showJoystickEvent);

        this.isTransitioning = false;
        this.nextHurdleReady = false;
        this.trafficLightColors = ['red'];
        this.currentColorIndex = 0;
        this.lastColorChangeTime = 0;
        this.terrainOffset = 0;
        this.terrainSpeed = this.BASE_TERRAIN_SPEED;
        this.isTrafficLightStopped = false;
        this.hasClickedThisHurdle = false;

        // Reinicializar elementos del juego
        this.generateColorSequence();
        // Crear un nuevo perro en la posición inicial
        this.dog = new Dog(this.DOG_X, this.canvas.height - 100);
        // Crear una nueva valla en la posición inicial
        this.hurdle = new Hurdle(this.INITIAL_HURDLE_X, this.canvas.height - 90);
        this.initializeClouds(); // Reinicializar las nubes
        this.initializeGrassAndFlowers();
        this.effects = new Effects(); // Reiniciar los efectos
        this.effects.clearAllParticles(); // Limpiar todas las partículas existentes

        // Agregar los event listeners
        document.addEventListener('keydown', this.boundKeydownHandler);
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('click', this.boundClickHandler);

        // Inicializar todas las posiciones posibles de flechas
        this.allArrowPositions = [];

        // Añadir posiciones verticales
        for (const x of this.VERTICAL_ARROW_POSITIONS) {
            this.allArrowPositions.push({ x, y: 0, isVertical: true });
        }

        // Añadir posiciones horizontales
        for (const y of this.HORIZONTAL_ARROW_POSITIONS) {
            this.allArrowPositions.push({ x: this.canvas.width, y, isVertical: false });
        }

        this.arrows = [];
        this.arrowSpawnCounter = 0;
        this.arrowCounter = 0;

        this.startGame();
    }

    private generateColorSequence() {
        // Comenzar con rojo
        this.trafficLightColors = ['red'];

        // Crear array de colores intermedios incluyendo rojo
        const middleColors = ['yellow', 'orange', 'green', 'red'];

        // En modo demostración, el color seleccionado será el segundo
        if (this.isInDemoMode) {
            // Elegir un color aleatorio para el salto (será el segundo color)
            const selectedColor = middleColors.filter(color => color !== 'red')[Math.floor(Math.random() * 3)];

            // Agregar el color seleccionado como segundo color
            this.trafficLightColors.push(selectedColor);

            // Generar 2 colores aleatorios adicionales
            for (let i = 0; i < 2; i++) {
                // Asegurarnos de que no se repitan colores consecutivos
                let nextColor;
                do {
                    nextColor = middleColors[Math.floor(Math.random() * middleColors.length)];
                } while (this.trafficLightColors[this.trafficLightColors.length - 1] === nextColor);

                this.trafficLightColors.push(nextColor);
            }

            // Terminar con rojo
            this.trafficLightColors.push('red');
        } else {
            // Comportamiento normal - mezclar los colores intermedios aleatoriamente
            for (let i = middleColors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [middleColors[i], middleColors[j]] = [middleColors[j], middleColors[i]];
            }
            // Agregar los colores mezclados y el rojo final
            this.trafficLightColors = this.trafficLightColors.concat(middleColors, ['red']);
        }
    }

    private nextHurdle() {
        if (!this.isInDemoMode && this.currentHurdle >= this.totalHurdles) {
            this.gameOver = true;
            return;
        }

        // Solo incrementar el contador si no estamos en modo demostración
        if (!this.isInDemoMode) {
            this.currentHurdle++;
        }

        this.dog.reset(this.dog.getX());
        this.isTransitioning = true;
        this.nextHurdleReady = true;
        this.isJumping = false;
        this.isTrafficLightStopped = false;
        this.hasClickedThisHurdle = false;

        // Reiniciar la velocidad al valor base
        this.terrainSpeed = this.BASE_TERRAIN_SPEED;

        this.generateColorSequence();
        this.currentColorIndex = 0;
        this.lastColorChangeTime = performance.now();
        this.createNewHurdle();
    }

    private drawClouds() {
        this.ctx.fillStyle = 'white';
        for (const cloud of this.clouds) {
            // Ajustar la posición X con el desplazamiento más lento para las nubes
            // Solo actualizar la posición si el juego no está terminado
            let adjustedX = cloud.x;
            if (!this.gameOver) {
                adjustedX = cloud.x - (this.terrainOffset * 0.3);

                // Si la nube sale completamente de la pantalla por la izquierda
                if (adjustedX < -cloud.width) {
                    cloud.x += this.canvas.width + cloud.width + 100;
                    cloud.y = Math.random() * 100 + 20; // Variar la altura al reaparecer
                    adjustedX = cloud.x - (this.terrainOffset * 0.3);
                }
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

        // Dibujar líneas discontinuas con movimiento invertido
        const lineLength = 30;
        const lineGap = 40;
        const totalLength = lineLength + lineGap;

        // Invertir la dirección del movimiento usando el terrainOffset negativo
        for (let x = -totalLength - (this.terrainOffset % totalLength); x < this.canvas.width + totalLength; x += totalLength) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, pathY + 20);
            this.ctx.lineTo(x + lineLength, pathY + 20);
            this.ctx.stroke();
        }
    }

    private drawTrafficLight() {
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

                // En modo demostración, detener en el color seleccionado (penúltima posición)
                if (this.isInDemoMode && this.currentColorIndex === this.trafficLightColors.length - 2) {
                    this.isTrafficLightStopped = true;
                    this.hasClickedThisHurdle = true;
                    // Aumentar la velocidad en modo demo
                    this.terrainSpeed = this.BASE_TERRAIN_SPEED * this.ACCELERATED_SPEED_MULTIPLIER;
                }
                
                // Si llegamos al último color (rojo) y no se ha seleccionado ningún color
                if (!this.hasClickedThisHurdle && this.currentColorIndex === this.trafficLightColors.length - 1) {
                    this.isTrafficLightStopped = true;
                    this.hasClickedThisHurdle = true;
                    this.terrainSpeed = this.BASE_TERRAIN_SPEED * this.ACCELERATED_SPEED_MULTIPLIER;
                }
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

    private updateGameInfo() {
        const currentHurdleElement = document.getElementById('currentHurdle');
        const successfulHurdlesElement = document.getElementById('successfulHurdles');
        const scoreElement = document.getElementById('score');

        if (currentHurdleElement) {
            currentHurdleElement.textContent = this.isInDemoMode ? '-/-' : `${this.currentHurdle}/${this.totalHurdles}`;
        }
        if (successfulHurdlesElement) {
            successfulHurdlesElement.textContent = this.isInDemoMode ? '-' : this.successfulHurdles.toString();
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

        // Dibujar el escudo
        this.drawShield();

        // Dibujar la valla
        this.hurdle.draw(this.ctx);

        // Dibujar flechas
        for (const arrow of this.arrows) {
            arrow.draw(this.ctx);
        }

        // Solo mostrar la información del juego si está en fullscreen
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer && gameContainer.classList.contains('fullscreen-mode')) {
            // Dibujar información del juego en el canvas
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.roundRect(10, 10, 200, 80, 10);
            this.ctx.fill();

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Vallas: ${this.currentHurdle}/${this.totalHurdles}`, 20, 40);
            this.ctx.fillText(`Puntos: ${this.score}`, 20, 70);
            this.ctx.restore();
        }

        // Dibujar los botones después de todo lo demás
        this.drawButtons();

        // Actualizar la información del juego en los paneles HTML
        this.updateGameInfo();

        if (this.gameOver) {
            // Si es el primer frame de gameOver, guardar el tiempo y reproducir sonido
            if (this.gameOverStartTime === 0) {
                this.gameOverStartTime = performance.now();
                this.soundEffects.playSound('game_over');
            }

            // Fondo semitransparente
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Crear efecto de confeti solo durante los primeros 4 segundos
            const timeSinceGameOver = performance.now() - this.gameOverStartTime;
            if (timeSinceGameOver < this.CONFETTI_DURATION && Math.random() < 0.3) {
                this.effects.createGameOverEffect();
            }

            // Dibujar efectos (confeti)
            this.effects.draw(this.ctx);

            // Texto de juego terminado
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Juego Terminado!', this.canvas.width / 2, this.canvas.height / 2 - 60);

            // Mostrar resultados finales
            this.ctx.font = 'bold 36px Arial';

            // Mensaje específico si perdió por saltar en rojo
            const currentColor = this.trafficLightColors[this.currentColorIndex];
            if (currentColor === 'red' && this.isJumping) {
                this.ctx.fillText('¡Has saltado en rojo!', this.canvas.width / 2, this.canvas.height / 2);
            }

            this.ctx.fillText(`Vallas Superadas: ${this.successfulHurdles}/${this.totalHurdles}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.fillText(`Puntuación Final: ${this.score} puntos`, this.canvas.width / 2, this.canvas.height / 2 + 100);

            // Instrucciones para reiniciar
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('Presiona ESPACIO para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 160);

            // Restablecer alineación del texto
            this.ctx.textAlign = 'left';
        } else {
            // Dibujar efectos solo si no es game over
            this.effects.draw(this.ctx);
        }
    }

    private initializeAudioControls() {
        // Configurar el control de volumen
        this.volumeSlider.addEventListener('input', () => {
            const volume = parseInt(this.volumeSlider.value) / 100;
            this.setVolume(volume);
            this.updateVolumeLines(volume);
        });

        // Configurar el botón de muteo
        this.muteButton.addEventListener('click', () => {
            this.toggleMute();
        });

        // Inicializar las líneas de volumen
        this.updateVolumeLines(parseInt(this.volumeSlider.value) / 100);
    }

    private updateVolumeLines(volume: number) {
        const lines = document.querySelectorAll('.volume-line');
        const thresholds = [0.33, 0.66, 1];

        lines.forEach((line, index) => {
            if (volume >= thresholds[index]) {
                (line as HTMLElement).style.backgroundColor = 'white';
            } else {
                (line as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.3)';
            }
        });
    }

    private setVolume(volume: number) {
        if (this.backgroundMusic) {
            if (!this.isMuted) {
                this.backgroundMusic.volume = volume;
                this.previousVolume = volume;
                this.updateVolumeLines(volume);
            }
        }
        this.soundEffects.setVolume(volume);
    }

    private toggleMute() {
        if (this.backgroundMusic) {
            this.isMuted = !this.isMuted;
            this.soundEffects.toggleMute();

            if (this.isMuted) {
                this.previousVolume = this.backgroundMusic.volume;
                this.backgroundMusic.volume = 0;
                this.muteButton.textContent = '🔇';
                this.muteButton.classList.add('muted');
                this.updateVolumeLines(0);
            } else {
                this.backgroundMusic.volume = this.previousVolume;
                this.muteButton.textContent = '🔊';
                this.muteButton.classList.remove('muted');
                this.updateVolumeLines(this.previousVolume);
            }
        }
    }

    private initializeBackgroundMusic() {
        try {
            this.backgroundMusic = new Audio();
            this.backgroundMusic.src = 'audio/background-music.mp3';
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = parseInt(this.volumeSlider.value) / 100;
            this.previousVolume = this.backgroundMusic.volume;
            this.backgroundMusic.autoplay = true;

            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('Música cargada y lista para reproducir');
                this.isMusicLoaded = true;
                this.startBackgroundMusic();
            });

            this.backgroundMusic.addEventListener('ended', () => {
                console.log('La música terminó, reiniciando...');
                if (this.backgroundMusic) {
                    this.backgroundMusic.currentTime = 0;
                    this.startBackgroundMusic();
                }
            });

            this.backgroundMusic.addEventListener('pause', () => {
                console.log('La música se pausó, intentando reanudar...');
                if (!this.gameOver) {
                    this.startBackgroundMusic();
                }
            });

            this.backgroundMusic.addEventListener('error', (e) => {
                console.error('Error al cargar la música:', e);
                this.backgroundMusic = null;
            });

            this.backgroundMusic.load();
        } catch (error) {
            console.error('Error al inicializar la música:', error);
            this.backgroundMusic = null;
        }
    }

    private startBackgroundMusic() {
        if (this.backgroundMusic && this.isMusicLoaded && !this.isMusicPlaying && !this.gameOver) {
            const playPromise = this.backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Música reproduciendo correctamente');
                        this.isMusicPlaying = true;
                    })
                    .catch(error => {
                        console.error('Error al reproducir la música:', error);
                        // Programar un nuevo intento en 1 segundo
                        setTimeout(() => {
                            if (!this.isMusicPlaying && !this.gameOver) {
                                this.startBackgroundMusic();
                            }
                        }, 1000);
                        this.isMusicPlaying = false;
                    });
            }
        }
    }

    private handleTouchStart(e: TouchEvent) {
        e.preventDefault(); // Prevenir el comportamiento por defecto
        
        // Verificar si algún toque es en los botones
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchX = (touch.clientX - rect.left) * scaleX;
            const touchY = (touch.clientY - rect.top) * scaleY;

            // Verificar si el toque es en algún botón
            let isButtonTouch = false;
            for (const button of this.buttons) {
                if (
                    touchX >= button.x &&
                    touchX <= button.x + button.width &&
                    touchY >= button.y &&
                    touchY <= button.y + button.height
                ) {
                    button.action();
                    isButtonTouch = true;
                    break;
                }
            }

            // Si no es un toque en un botón y no se ha detenido el semáforo
            if (!isButtonTouch && !this.hasClickedThisHurdle) {
                this.isTrafficLightStopped = true;
                this.hasClickedThisHurdle = true;
                this.terrainSpeed = this.BASE_TERRAIN_SPEED * this.ACCELERATED_SPEED_MULTIPLIER;
            }
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        e.preventDefault(); // Prevenir el comportamiento por defecto
        
        if (this.gameOver) {
            // Disparar un evento personalizado para mostrar el joystick
            const showJoystickEvent = new CustomEvent('showJoystick');
            document.dispatchEvent(showJoystickEvent);
            this.initializeGame();
        }
    }

    private handleClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Verificar si se hizo clic en algún botón
        for (const button of this.buttons) {
            if (
                clickX >= button.x &&
                clickX <= button.x + button.width &&
                clickY >= button.y &&
                clickY <= button.y + button.height
            ) {
                button.action();
                return;
            }
        }

        // Si no se hizo clic en ningún botón, manejar el clic normal del juego
        if (this.gameOver) {
            // Disparar un evento personalizado para mostrar el joystick
            const showJoystickEvent = new CustomEvent('showJoystick');
            document.dispatchEvent(showJoystickEvent);
            this.initializeGame();
        } else if (!this.hasClickedThisHurdle) {
            this.isTrafficLightStopped = true;
            this.hasClickedThisHurdle = true;
            this.terrainSpeed = this.BASE_TERRAIN_SPEED * this.ACCELERATED_SPEED_MULTIPLIER;
        }

        // Prevenir comportamientos por defecto
        e.preventDefault();
    }

    private handleKeydown(e: KeyboardEvent) {
        // Evitar que el evento se procese múltiples veces
        if (e.repeat) return;

        if (e.code === 'Space' && this.gameOver) {
            // Disparar un evento personalizado para mostrar el joystick
            const showJoystickEvent = new CustomEvent('showJoystick');
            document.dispatchEvent(showJoystickEvent);
            this.initializeGame();
            // Prevenir el comportamiento por defecto del espacio
            e.preventDefault();
        }

        // En modo demostración, permitir que el jugador salte con la tecla de flecha arriba
        if (this.isInDemoMode && e.code === 'ArrowUp' && !this.isJumping && !this.dog.isInRecovery()) {
            const distanceToHurdle = Math.abs(this.hurdle.getX() - this.DOG_X);
            if (distanceToHurdle < this.JUMP_DETECTION_DISTANCE) {
                this.evaluateJump();
            }
        }
    }

    private update() {
        const currentTime = performance.now();

        // Actualizar efectos siempre, incluso en game over
        this.effects.update();

        if (this.gameOver) {
            // Ya no disparamos el evento gameOver
            return;
        }

        this.dog.update();

        if (!this.isMusicPlaying && this.isMusicLoaded) {
            this.startBackgroundMusic();
        }

        this.updateArrows();

        // Actualizar el terreno y la valla si el perro no está en recuperación
        if (!this.dog.isInRecovery()) {
            this.updateHurdlePosition();
            if (this.dog.isInReturnState()) {
                this.terrainOffset += this.terrainSpeed * 1.2;
            } else {
                this.terrainOffset += this.terrainSpeed;
            }
        }

        this.updateTrafficLight(currentTime);
        this.updateTrafficLightPosition(currentTime);
    }

    private checkCollision(rect1: { x: number, y: number, width: number, height: number },
        rect2: { x: number, y: number, width: number, height: number }): boolean {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    private startGame() {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
        }

        // Intentar iniciar la música al comenzar el juego
        this.startBackgroundMusic();

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

        // Si estamos en transición y es la nueva valla, usar la velocidad base
        if (this.isTransitioning && this.nextHurdleReady) {
            this.isTransitioning = false; // Resetear el estado de transición
            this.nextHurdleReady = false; // Resetear el estado de la nueva valla
        } else {

        }
    }

    private updateHurdlePosition() {
        if (this.gameOver) return;

        const currentX = this.hurdle.getX();
        // Ajustar la velocidad de la valla según el estado del perro
        let moveSpeed = this.terrainSpeed;
        if (this.dog.isInReturnState()) {
            moveSpeed *= 1.5; // Aumentar la velocidad durante el retorno
        }
        let newX = currentX - moveSpeed;

        // Solo evaluar el salto si el perro no está retornando y no está en transición
        if (!this.isJumping && !this.dog.isInRecovery() && !this.dog.isInReturnState() && !this.isTransitioning) {
            const distanceToHurdle = Math.abs(newX - this.DOG_X);

            // En modo demostración, saltar cuando la valla esté cerca y el semáforo esté detenido
            if (this.isInDemoMode && this.isTrafficLightStopped && distanceToHurdle < this.JUMP_DETECTION_DISTANCE) {
                this.evaluateJump();
            }
            // En modo normal, evaluar saltos normalmente
            else if (!this.isInDemoMode && distanceToHurdle < this.JUMP_DETECTION_DISTANCE) {
                this.evaluateJump();
            }
        }

        this.hurdle.setX(newX);
    }

    private evaluateJump() {
        if (this.gameOver || this.isJumping || this.dog.isInRecovery() || this.dog.isInReturnState()) return;

        this.isJumping = true;
        const hurdleX = this.hurdle.getX();

        if (!this.hasClickedThisHurdle) {
            // Si no ha hecho clic, es un fallo automático
            this.dog.failJump(hurdleX + this.JUMP_LANDING_OFFSET);

            this.effects.createFailEffect(this.dog.getX(), this.canvas.height - 90);
            this.soundEffects.playSound('fail_jump');
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
                this.effects.createSuccessEffect(this.dog.getX(), this.canvas.height - 120);
                this.soundEffects.playSound('perfect_jump');
            } else if (currentColor === 'yellow') {
                this.dog.normalJump(hurdleX + this.JUMP_LANDING_OFFSET);
                this.score += 10;
                this.effects.createSuccessEffect(this.dog.getX(), this.canvas.height - 120);
                this.soundEffects.playSound('good_jump');
            } else if (currentColor === 'orange') {
                this.dog.normalJump(hurdleX + this.JUMP_LANDING_OFFSET);
                this.score += 5;
                this.effects.createSuccessEffect(this.dog.getX(), this.canvas.height - 120);
                this.soundEffects.playSound('good_jump');
            }
            this.handleJumpResult(true);
        } else {
            this.dog.failJump(hurdleX + this.JUMP_LANDING_OFFSET);

            this.effects.createFailEffect(this.dog.getX(), this.canvas.height - 90);
            this.soundEffects.playSound('fail_jump');
            this.handleFailedJump();
        }
    }

    private handleFailedJump() {
        const checkRecovery = () => {
            if (this.dog.isInRecovery() || this.dog.isInReturnState()) {
                setTimeout(checkRecovery, 100);
            } else {
                if (this.currentHurdle >= this.totalHurdles) {
                    this.handleGameOver();
                } else if (this.dog.hasReturnedToStart()) {
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

        // Para saltos exitosos, esperar a que el perro regrese
        const checkReturn = () => {
            if (this.dog.isInReturnState()) {
                setTimeout(checkReturn, 100);
            } else {
                // En modo demostración, no incrementar el contador de vallas exitosas
                if (!this.isInDemoMode) {
                    this.successfulHurdles++;
                }
                
                if (!this.isInDemoMode && this.currentHurdle >= this.totalHurdles) {
                    this.handleGameOver();
                } else {
                    this.nextHurdle();
                }
            }
        };

        setTimeout(checkReturn, 1000);
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

    public setPlayerName(name: string) {
        this.playerName = name || 'Invitado';
    }

    public setDemoMode(enabled: boolean) {
        this.isInDemoMode = enabled;
        if (enabled) {
            // Reiniciar la secuencia de colores cuando se activa el modo demo
            this.generateColorSequence();
        }
    }

    public isDemoMode(): boolean {
        return this.isInDemoMode;
    }

    private async handleGameOver() {
        this.gameOver = true;
        this.effects.setGameOver(true);
        this.gameOverStartTime = performance.now();
        this.soundEffects.playSound('game_over');

        // Ocultar el joystick al finalizar la partida
        const joystickContainer = document.getElementById('joystick-container');
        if (joystickContainer) {
            joystickContainer.classList.add('hidden');
        }

        try {
            // Guardar la puntuación
            await this.scoreSystem.addScore(this.playerName, this.score, this.totalHurdles);

            // Actualizar la tabla de puntuaciones
            const updateScoreTableEvent = new CustomEvent('updateScoreTable');
            document.dispatchEvent(updateScoreTableEvent);
        } catch (error) {
            console.error('Error al guardar la puntuación:', error);
            // Intentar guardar localmente si falla la sincronización
            localStorage.setItem('pending_scores', JSON.stringify({
                playerName: this.playerName,
                score: this.score,
                hurdleCount: this.totalHurdles,
                date: new Date().toISOString()
            }));
        }
    }

    private generateArrow(): void {
        if (this.arrows.length >= this.MAX_ARROWS) return;

        this.arrowSpawnCounter++;
        if (this.arrowSpawnCounter < this.ARROW_SPAWN_RATE) return;

        this.arrowSpawnCounter = 0;
        this.arrowCounter++;

        const dogX = this.dog.getX();
        const dogY = this.dog.getY();
        const position = this.allArrowPositions[Math.floor(Math.random() * this.allArrowPositions.length)];

        let targetX: number, targetY: number;

        if (position.isVertical) {
            targetX = position.x + (Math.random() - 0.5) * 300;
            targetY = dogY - Math.random() * 100;

            if (Math.random() < 0.6) {
                targetX = dogX - 25 + Math.random() * 50;
            }
        } else {
            targetX = dogX;
            targetY = Math.random() < 0.7 ?
                dogY - 10 + Math.random() * 20 :  // Apuntar al cuerpo
                dogY - 40 + Math.random() * 80;   // Variar altura
        }

        const speed = position.isVertical ? this.ARROW_SPEED : this.HORIZONTAL_ARROW_SPEED;
        this.arrows.push(new Arrow(position.x, position.y, speed, targetX, targetY, !position.isVertical));
    }

    private updateArrows(): void {
        // Actualizar y filtrar flechas existentes
        this.arrows = this.arrows.filter(arrow => {
            arrow.update();
            const pos = arrow.getPosition();

            // Verificar si la flecha sale de la pantalla o expira
            if (pos.y > this.canvas.height || pos.x < 0 || pos.x > this.canvas.width || arrow.isExpired()) {
                return false;
            }

            // Verificar colisión con el escudo usando la posición actual del perro
            const arrowBounds = arrow.getBounds();
            if (this.checkShieldCollision(arrowBounds)) {
                this.effects.createSuccessEffect(pos.x, pos.y);
                this.soundEffects.playSound('shield_block');
                return false;
            }

            return true;
        });

        // Generar nueva flecha si es necesario
        this.generateArrow();

        // Verificar colisiones con el perro
        const dogBounds = this.dog.getBounds();
        for (const arrow of this.arrows) {
            if (this.checkCollision(dogBounds, arrow.getBounds())) {
                this.score = Math.max(0, this.score - 5);
                this.arrows = this.arrows.filter(a => a !== arrow);
                this.effects.createFailEffect(this.dog.getX(), this.canvas.height - 90);
                this.soundEffects.playSound('arrow_impact');
            }
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        // Solo actualizar el ángulo del escudo si no se está usando el joystick
        if (!document.getElementById('joystick-base')?.matches(':active')) {
            const dogX = this.dog.getX();
            const dogY = this.dog.getY();
            this.shieldAngle = Math.atan2(this.mouseY - dogY, this.mouseX - dogX);
        }
    }

    private drawShield(): void {
        const dogX = this.dog.getX();
        const dogY = this.dog.getY();

        // Dibujar el área de colisión (semitransparente)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(
            dogX,
            dogY,
            this.SHIELD_COLLISION_RADIUS,
            this.shieldAngle - this.SHIELD_COLLISION_ARC / 2,
            this.shieldAngle + this.SHIELD_COLLISION_ARC / 2
        );
        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
        this.ctx.fill();

        // Dibujar el escudo principal
        this.ctx.beginPath();
        this.ctx.arc(
            dogX,
            dogY,
            this.SHIELD_RADIUS,
            this.shieldAngle - this.SHIELD_ARC / 2,
            this.shieldAngle + this.SHIELD_ARC / 2
        );

        // Gradiente para efecto de energía
        const gradient = this.ctx.createRadialGradient(
            dogX, dogY, this.SHIELD_RADIUS * 0.8,
            dogX, dogY, this.SHIELD_RADIUS
        );
        gradient.addColorStop(0, 'rgba(0, 150, 255, 0.2)');
        gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0.6)');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Borde brillante
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Efecto de brillo en los bordes
        this.ctx.beginPath();
        this.ctx.arc(
            dogX,
            dogY,
            this.SHIELD_RADIUS,
            this.shieldAngle - this.SHIELD_ARC / 2,
            this.shieldAngle + this.SHIELD_ARC / 2
        );
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    private checkShieldCollision(arrowBounds: { x: number, y: number, width: number, height: number }): boolean {
        const dogX = this.dog.getX();
        const dogY = this.dog.getY();

        // Obtener los puntos de la flecha para mejor detección
        const arrowPoints = [
            { x: arrowBounds.x, y: arrowBounds.y },
            { x: arrowBounds.x + arrowBounds.width, y: arrowBounds.y },
            { x: arrowBounds.x + arrowBounds.width, y: arrowBounds.y + arrowBounds.height },
            { x: arrowBounds.x, y: arrowBounds.y + arrowBounds.height },
            { x: arrowBounds.x + arrowBounds.width / 2, y: arrowBounds.y + arrowBounds.height / 2 }
        ];

        // Verificar cada punto de la flecha
        for (const point of arrowPoints) {
            // Calcular la distancia entre el punto y el centro del escudo
            const distance = Math.sqrt(
                Math.pow(point.x - dogX, 2) +
                Math.pow(point.y - dogY, 2)
            );

            // Si el punto está dentro del radio de colisión del escudo
            if (distance <= this.SHIELD_COLLISION_RADIUS) {
                // Calcular el ángulo del punto respecto al perro
                const pointAngle = Math.atan2(point.y - dogY, point.x - dogX);

                // Normalizar los ángulos
                let angleDiff = pointAngle - this.shieldAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Si el punto está dentro del arco de colisión del escudo
                if (Math.abs(angleDiff) <= this.SHIELD_COLLISION_ARC / 2) {
                    return true;
                }
            }
        }

        return false;
    }

    public setShieldAngle(angle: number): void {
        this.shieldAngle = angle;
    }

    private initializeButtons() {
        const buttonY = 10;
        const buttonPadding = 10;
        
        // Botón de reiniciar
        const restartText = '🔄 Reiniciar';
        this.ctx.font = this.BUTTON_FONT;
        const restartWidth = this.ctx.measureText(restartText).width + (buttonPadding * 2);
        
        // Botón de ayuda
        const helpText = '❓ Ayuda';
        const helpWidth = this.ctx.measureText(helpText).width + (buttonPadding * 2);
        
        // Posicionar los botones en la esquina superior derecha
        const restartX = this.canvas.width - restartWidth - helpWidth - 20;
        const helpX = this.canvas.width - helpWidth - 10;

        this.buttons = [
            {
                x: restartX,
                y: buttonY,
                width: restartWidth,
                height: this.BUTTON_HEIGHT,
                text: restartText,
                action: () => this.initializeGame()
            },
            {
                x: helpX,
                y: buttonY,
                width: helpWidth,
                height: this.BUTTON_HEIGHT,
                text: helpText,
                action: () => this.showHelp()
            }
        ];
    }

    private drawButtons() {
        this.ctx.save();
        
        for (const button of this.buttons) {
            // Dibujar el fondo del botón
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.roundRect(button.x, button.y, button.width, button.height, 5);
            this.ctx.fill();

            // Dibujar el texto del botón
            this.ctx.fillStyle = 'white';
            this.ctx.font = this.BUTTON_FONT;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        }

        this.ctx.restore();
    }

    private showHelp() {
        const modal = document.getElementById('instructions-modal');
        if (modal instanceof HTMLElement) {
            modal.style.display = 'flex';
            // Activar el modo demostración
            this.setDemoMode(true);
            this.initializeGame();
        }
    }
}