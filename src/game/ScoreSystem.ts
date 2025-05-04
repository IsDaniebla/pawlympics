import { config } from '../config';

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
    private readonly API_URL = config.jsonbin.apiUrl;
    private readonly API_KEY = config.jsonbin.apiKey;

    constructor() {
        // Asegurarse de que exista la estructura en localStorage
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({}));
        }
        if (!localStorage.getItem(this.PLAYERS_KEY)) {
            localStorage.setItem(this.PLAYERS_KEY, JSON.stringify([]));
        }
        // Sincronizar puntuaciones al iniciar
        this.syncScores();
        // Intentar sincronizar puntuaciones pendientes
        this.syncPendingScores();
    }

    private async syncScores(): Promise<void> {
        try {
            // Obtener puntuaciones del backend
            const response = await fetch(this.API_URL, {
                headers: {
                    'X-Master-Key': this.API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const remoteScores = data.record || {};
                
                // Combinar puntuaciones locales y remotas
                const localScores = this.getAllScores();
                const mergedScores = this.mergeScores(localScores, remoteScores);
                
                // Actualizar localStorage
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedScores));
                
                // Actualizar backend
                await this.updateRemoteScores(mergedScores);
            }
        } catch (error) {
            console.error('Error sincronizando puntuaciones:', error);
        }
    }

    private async updateRemoteScores(scores: { [key: string]: Score[] }): Promise<void> {
        try {
            await fetch(this.API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.API_KEY
                },
                body: JSON.stringify(scores)
            });
        } catch (error) {
            console.error('Error actualizando puntuaciones remotas:', error);
        }
    }

    private mergeScores(local: { [key: string]: Score[] }, remote: { [key: string]: Score[] }): { [key: string]: Score[] } {
        const merged: { [key: string]: Score[] } = {};
        
        // Combinar todas las claves
        const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
        
        allKeys.forEach(key => {
            const localScores = local[key] || [];
            const remoteScores = remote[key] || [];
            
            // Combinar arrays y eliminar duplicados
            const combinedScores = [...localScores, ...remoteScores];
            const uniqueScores = this.removeDuplicates(combinedScores);
            
            // Ordenar por puntuación y limitar a MAX_SCORES_PER_HURDLE
            merged[key] = uniqueScores
                .sort((a, b) => b.score - a.score)
                .slice(0, this.MAX_SCORES_PER_HURDLE);
        });
        
        return merged;
    }

    private removeDuplicates(scores: Score[]): Score[] {
        const seen = new Map<string, Score>();
        
        scores.forEach(score => {
            const key = `${score.playerName}-${score.hurdleCount}`;
            if (!seen.has(key) || seen.get(key)!.score < score.score) {
                seen.set(key, score);
            }
        });
        
        return Array.from(seen.values());
    }

    public async addScore(playerName: string, score: number, hurdleCount: number): Promise<void> {
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
        
        // Sincronizar con el backend
        await this.syncScores();
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

    private async syncPendingScores(): Promise<void> {
        const pendingScores = localStorage.getItem('pending_scores');
        if (pendingScores) {
            try {
                const scores = JSON.parse(pendingScores);
                await this.addScore(scores.playerName, scores.score, scores.hurdleCount);
                // Si la sincronización es exitosa, eliminar las puntuaciones pendientes
                localStorage.removeItem('pending_scores');
            } catch (error) {
                console.error('Error sincronizando puntuaciones pendientes:', error);
            }
        }
    }
} 