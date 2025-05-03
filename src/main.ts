import { Game } from './game/Game.ts'
import { ScoreSystem } from './game/ScoreSystem.ts'
import './style.css'

// Extender el objeto Window para incluir las funciones globales
declare global {
  interface Window {
    selectPlayer: (player: string) => void;
    restartGame: () => void;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Mostrar el modal de instrucciones al inicio
  const modal = document.getElementById('instructions-modal')
  const startButton = document.getElementById('start-game')
  
  if (modal) {
    modal.style.display = 'flex'
  }

  // Inicializar el sistema de puntuación
  const scoreSystem = new ScoreSystem()
  let game: Game | null = null

  // Inicializar el juego cuando se haga clic en comenzar
  startButton?.addEventListener('click', () => {
    if (modal) {
      modal.style.display = 'none'
    }
    
    if (!game) {
      // Inicializar el juego solo si no existe
      game = new Game('gameCanvas', scoreSystem)
    }
    
    // Desactivar el modo demostración y reiniciar el juego
    game.setDemoMode(false)
    initGame() // Reiniciar el juego al desactivar el modo demo
    
    // Configurar eventos y funciones globales necesarias
    window.selectPlayer = (player: string) => {
      const playerSelect = document.getElementById('playerSelect') as HTMLInputElement
      const playerList = document.getElementById('playerList')
      playerSelect.value = player
      if (playerList) {
        playerList.style.display = 'none'
      }
      game?.setPlayerName(player)
      initGame()
    }

    window.restartGame = () => {
      initGame()
    }

    function initGame() {
      const hurdlesInput = document.getElementById('hurdlesCount') as HTMLInputElement
      const hurdlesCount = parseInt(hurdlesInput.value)
      game?.setTotalHurdles(hurdlesCount)
      game?.restart()
      updateScoreTable()
    }

    function updateScoreTable() {
      const hurdlesInput = document.getElementById('hurdlesCount') as HTMLInputElement
      const hurdleCount = parseInt(hurdlesInput.value)
      const scores = scoreSystem.getTopScores(hurdleCount)
      
      // Actualizar tabla mini
      const miniTbody = document.getElementById('miniScoreTableBody')
      if (miniTbody) {
        miniTbody.innerHTML = scores.slice(0, 4).map((score, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${score.playerName.length > 8 ? score.playerName.substring(0, 8) + '...' : score.playerName}</td>
            <td>${score.score}</td>
          </tr>
        `).join('')
      }
    }

    // Configurar eventos para el selector de jugador
    const playerSelect = document.getElementById('playerSelect') as HTMLInputElement
    const playerList = document.getElementById('playerList')
    
    playerSelect?.addEventListener('input', () => {
      const searchTerm = playerSelect.value.toLowerCase()
      const players = scoreSystem.getAllPlayers()
      
      if (playerList) {
        const filteredPlayers = players.filter(player => 
          player.toLowerCase().includes(searchTerm)
        )
        
        playerList.style.display = 'block'
        playerList.innerHTML = filteredPlayers
          .map(player => `<div onclick="window.selectPlayer('${player}')">${player}</div>`)
          .join('')
          
        if (filteredPlayers.length === 0) {
          playerList.style.display = 'none'
        }
      }
    })

    // Iniciar el juego
    initGame()
  })
})
