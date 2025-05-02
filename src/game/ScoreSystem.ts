interface Score {
    playerName: string;
    score: number;
    hurdleCount: number;
    date: string;
}

export class ScoreSystem {
    private readonly STORAGE_KEY = 'pawlympics_scores';
    private readonly PLAYERS_KEY = 'pawlympics_players';
    private readonly MAX_SCORES_PER_HURDLE = 5;

    constructor() {
        // Asegurarse de que exista la estructura en localStorage
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
        }
        if (!localStorage.getItem(this.PLAYERS_KEY)) {
            localStorage.setItem(this.PLAYERS_KEY, JSON.stringify([]));
        }
    }

    public addScore(playerName: string, score: number, hurdleCount: number): void {
        const scores = this.getAllScores();
        const hurdleKey = `hurdle_${hurdleCount}`;
        const players = this.getStoredPlayers();
        const finalPlayerName = playerName || 'Invitado';
        
        if (!scores[hurdleKey]) {
            scores[hurdleKey] = [];
        }

        // Buscar si el jugador ya tiene una puntuación para este número de vallas
        const existingScoreIndex = scores[hurdleKey].findIndex(s => s.playerName === finalPlayerName);

        if (existingScoreIndex !== -1) {
            // Si el jugador ya tiene una puntuación, actualizar solo si la nueva es mejor
            if (score > scores[hurdleKey][existingScoreIndex].score) {
                scores[hurdleKey][existingScoreIndex] = {
                    playerName: finalPlayerName,
                    score,
                    hurdleCount,
                    date: new Date().toISOString()
                };
            }
        } else {
            // Si el jugador no tiene puntuación, agregar la nueva
            scores[hurdleKey].push({
                playerName: finalPlayerName,
                score,
                hurdleCount,
                date: new Date().toISOString()
            });
        }

        // Ordenar por puntuación (mayor a menor)
        scores[hurdleKey].sort((a, b) => b.score - a.score);

        // Guardar el jugador si no es invitado y no existe
        if (playerName && playerName !== 'Invitado' && !players.includes(playerName)) {
            players.push(playerName);
            localStorage.setItem(this.PLAYERS_KEY, JSON.stringify(players));
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
    }

    public getTopScores(hurdleCount: number): Score[] {
        const scores = this.getAllScores();
        const hurdleKey = `hurdle_${hurdleCount}`;
        return (scores[hurdleKey] || []).slice(0, this.MAX_SCORES_PER_HURDLE);
    }

    public getAllPlayers(): string[] {
        return this.getStoredPlayers();
    }

    private getAllScores(): { [key: string]: Score[] } {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    }

    private getStoredPlayers(): string[] {
        return JSON.parse(localStorage.getItem(this.PLAYERS_KEY) || '[]');
    }
} 