import { Game } from './game/Game.ts'
import { ScoreSystem } from './game/ScoreSystem.ts'
import './style.css'

// Extender el objeto Window para incluir las funciones globales
declare global {
  interface Window {
    selectPlayer: (player: string) => void;
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
  })

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

  function initGame() {
    const hurdlesInput = document.getElementById('hurdlesCount') as HTMLInputElement
    const hurdlesCount = parseInt(hurdlesInput.value)
    game?.setTotalHurdles(hurdlesCount)
    game?.restart()
    updateScoreTable()
  }

  function updateScoreTable() {
    const hurdlesInput = document.getElementById('hurdlesCount') as HTMLInputElement
    const hurdlesCount = parseInt(hurdlesInput.value)
    const scores = scoreSystem.getTopScores(hurdlesCount)
    const tbody = document.getElementById('miniScoreTableBody')

    if (tbody) {
      tbody.innerHTML = ''
      scores.slice(0, 4).forEach((score, index) => {
        const row = document.createElement('tr')
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${score.playerName}</td>
          <td>${score.score}</td>
        `
        tbody.appendChild(row)
      })
    }
  }

  // Event listeners para el selector de jugador
  const playerSelect = document.getElementById('playerSelect')
  
  playerSelect?.addEventListener('focus', function() {
    updatePlayerList()
  })

  playerSelect?.addEventListener('input', updatePlayerList)
  
  playerSelect?.addEventListener('blur', () => {
    setTimeout(() => {
      const playerSelect = document.getElementById('playerSelect') as HTMLInputElement
      const playerList = document.getElementById('playerList')
      if (playerList) {
        playerList.style.display = 'none'
      }
      
      if (!playerSelect.value.trim()) {
        const previousValue = playerSelect.getAttribute('data-current-value') || 'Invitado'
        updatePlayerInfo(previousValue)
      }
    }, 200)
  })

  playerSelect?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const playerList = document.getElementById('playerList')
      if (playerList) {
        playerList.style.display = 'none'
      }
      initGame()
    }
  })

  document.getElementById('hurdlesCount')?.addEventListener('change', () => {
    updateScoreTable()
    initGame()
  })

  // Función para actualizar la información del jugador
  function updatePlayerInfo(playerName: string, updateInput = true) {
    const playerSelect = document.getElementById('playerSelect') as HTMLInputElement
    const finalName = playerName.trim() || playerSelect.getAttribute('data-current-value') || 'Invitado'
    
    if (updateInput) {
      playerSelect.value = playerName
    }
    
    playerSelect.setAttribute('data-current-value', finalName)
    const currentPlayerElement = document.getElementById('currentPlayer')
    if (currentPlayerElement) {
      currentPlayerElement.textContent = finalName
    }
    
    if (game) {
      game.setPlayerName(finalName)
    }
  }

  // Función para actualizar la lista de jugadores
  function updatePlayerList() {
    const playerSelect = document.getElementById('playerSelect') as HTMLInputElement
    const playerList = document.getElementById('playerList')
    const searchTerm = playerSelect.value.toLowerCase()
    
    if (playerList) {
      const players = scoreSystem.getAllPlayers()
      const filteredPlayers = players.filter((player: string) => 
        player.toLowerCase().includes(searchTerm)
      )

      playerList.innerHTML = ''
      filteredPlayers.forEach((player: string) => {
        const div = document.createElement('div')
        div.textContent = player
        div.onclick = () => window.selectPlayer(player)
        playerList.appendChild(div)
      })

      playerList.style.display = filteredPlayers.length > 0 ? 'block' : 'none'
    }
  }

  // Escuchar el evento de actualización de la tabla de puntuaciones
  document.addEventListener('updateScoreTable', updateScoreTable)

  // Inicializar el juego cuando la página cargue
  window.addEventListener('load', () => {
    updatePlayerInfo('Invitado')
    updateScoreTable()
    initGame()
  })
})
