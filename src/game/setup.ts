/**
 * Inicializa y configura el juego
 * @returns Función para limpiar los recursos del juego
 */
export function setupGame(): () => void {
  console.log('Configurando el juego...')
  
  const gameCanvas = document.getElementById('game-canvas')
  if (!gameCanvas) {
    console.error('No se encontró el elemento game-canvas')
    return () => {}
  }

  // Crear el canvas del juego
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 400
  canvas.style.border = '2px solid black'
  canvas.style.backgroundColor = 'white'
  
  // Limpiar y agregar el nuevo canvas
  gameCanvas.innerHTML = ''
  gameCanvas.appendChild(canvas)
  console.log('Canvas creado y agregado al DOM')

  // Obtener el contexto del canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('No se pudo obtener el contexto 2D del canvas')
    return () => {}
  }
  console.log('Contexto 2D obtenido correctamente')

  // Configuración inicial del juego
  const gameState = {
    started: true,
    score: 0,
    playerPosition: { x: 50, y: canvas.height - 50 },
    obstacles: []
  }
  console.log('Estado inicial del juego configurado')

  // Función para dibujar el jugador
  function drawPlayer(context: CanvasRenderingContext2D) {
    context.beginPath()
    context.arc(gameState.playerPosition.x, gameState.playerPosition.y, 20, 0, Math.PI * 2)
    context.fillStyle = '#3498db'
    context.fill()
    context.closePath()
  }

  // Función para dibujar el suelo
  function drawGround(context: CanvasRenderingContext2D) {
    context.beginPath()
    context.moveTo(0, canvas.height - 10)
    context.lineTo(canvas.width, canvas.height - 10)
    context.strokeStyle = '#2c3e50'
    context.lineWidth = 2
    context.stroke()
    context.closePath()
  }

  // Game loop principal
  function gameLoop() {
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar elementos del juego
    drawGround(ctx)
    drawPlayer(ctx)

    // Continuar el loop si el juego está activo
    if (gameState.started) {
      requestAnimationFrame(gameLoop)
    }
  }

  // Manejar eventos del teclado
  function handleKeyPress(e: KeyboardEvent) {
    if (!gameState.started) return

    const speed = 5
    switch(e.key) {
      case 'ArrowLeft':
        gameState.playerPosition.x = Math.max(20, gameState.playerPosition.x - speed)
        break
      case 'ArrowRight':
        gameState.playerPosition.x = Math.min(canvas.width - 20, gameState.playerPosition.x + speed)
        break
    }
  }

  // Agregar event listener para el teclado
  document.addEventListener('keydown', handleKeyPress)
  console.log('Event listeners configurados')

  // Iniciar el juego
  console.log('Iniciando el game loop...')
  gameLoop()

  // Retornar una función de limpieza
  return () => {
    console.log('Limpiando recursos del juego...')
    gameState.started = false
    document.removeEventListener('keydown', handleKeyPress)
  }
} 