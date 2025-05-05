export class SoundEffects {
    private sounds: { [key: string]: HTMLAudioElement } = {
        'perfect_jump': new Audio('audio/perfect_jump.mp3'),
        'good_jump': new Audio('audio/good_jump.mp3'),
        'fail_jump': new Audio('audio/fail_jump.mp3'),
        'game_over': new Audio('audio/game_over.mp3'),
        'arrow_impact': new Audio('audio/arrow_impact.mp3'),
        'shield_block': new Audio('audio/shield_block.mp3')
    };
    
    private isMuted: boolean = false;
    private volume: number = 0.3;

    constructor() {
        this.initializeSounds();
    }

    private initializeSounds() {
        // Cargar los efectos de sonido
        this.loadSound('perfect_jump', 'audio/perfect_jump.mp3');
        this.loadSound('good_jump', 'audio/good_jump.mp3');
        this.loadSound('fail_jump', 'audio/fail_jump.mp3');
        this.loadSound('game_over', 'audio/game_over.mp3');
    }

    private loadSound(name: string, path: string) {
        const audio = new Audio();
        audio.src = path;
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    public playSound(name: string) {
        if (this.isMuted || !this.sounds[name]) return;

        // Verificar si es un dispositivo móvil y si no está en pantalla completa
        const gameContainer = document.querySelector('.game-container');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isFullscreen = gameContainer?.classList.contains('fullscreen-mode') || false;

        // Si es móvil y no está en pantalla completa, no reproducir sonido
        if (isMobile && !isFullscreen) {
            return;
        }

        // Reiniciar el sonido si ya está reproduciéndose
        const sound = this.sounds[name];
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.error(`Error reproduciendo sonido ${name}:`, error);
        });
    }

    public setVolume(volume: number) {
        this.volume = volume;
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.isMuted ? 0 : this.volume;
        });
    }

    public isSoundMuted(): boolean {
        return this.isMuted;
    }

    public stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
} 