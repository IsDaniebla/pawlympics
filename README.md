# 🐾 Pawlympics

Juego desafiante donde el objetivo es acumular la mayor cantidad de puntos, eligiendo los colores con mayor puntuación y protegiéndose para evitar perder puntos por el impacto de flechas.

## 🎮 Características

- Sistema de puntuación y rankings con funcionamiento local y actualización global
- Compatibilidad para celulares y computadoras
- Detección de colisiones por flechas y aproximación de vallas
- Marcación de puntaje en tiempo real
- Joystick para versión móvil
- Apartado de ayuda con demostración del juego en tiempo real
- Efectos de sonido y visuales para distintos momentos
- Semáforo con orden aleatorio de colores intermedios
- Control de volumen
- Botón para reiniciar
- Selección de número de vallas
- Ingreso de nombre personalizado
- Sistema de salto y caída de vallas
- Tiro de flechas con probabilidad de ser dirigidas

## 🛠️ Tecnologías

- TypeScript
- Vite
- HTML5 Canvas
- Web Audio API
- JSONBin.io (para almacenamiento de puntuaciones)
- LocalStorage (para datos locales)

## 🤖 Uso de Inteligencia Artificial

### Herramientas Utilizadas
- **Cursor**: IDE potenciado por IA, utilizado para la generación
- **Claude 3 Sonnet**: Modelo de lenguaje utilizado a través de Cursor
- **Chat GPT4**: Para resolver dudas específicas

## Porcentaje estimado de código generado
- Creo que el 97% fue autogenerado, solo hubo una ocación crítica en la que se necesitó modificar el código manualmente y hubo veces que se tuvo que limpiar código para evitar errores de lint  

## Prompts
- Se crearon un conjunto de reglas para tener una linea general de respuestas en todas las respuestas:
 - dont explain the project if i don't ask you
 - Don't refactor code by removing things unless you're asked to. You just have to let them know.
 - piensa que eres el mejor desarrollador de videojuegos web
 - Do not add extra features that have not been requested. If you think it is necessary, ask if you want to integrate them and explain it.
 - Always respond in Spanish

- Se buscó en caso de querer una nueva funcionalidad explicar que es lo que se desea de forma clara sin tanto texto y tratar de agregar como se espera que se comporte con el resto del sistema
- Cuando había problemas que la IA no podía resolver se buscó manualmente el origen del problema para identificarlo y explicarle a la IA cuál es el origen del problema.
- Había momentos en los que era necesario especificar que solo especificamente se concentre en el problema dado que termina modificando otras funcionalidades
- Encontré que la IA es muy buena para que te explique el recorrido de ejecución de una acción y es fácil pedir que agregue console.log a momentos clave
- Se confió en el contexto global de la aplicación pero en ocaciones para momento específicos fue necesario hablar técnicamente de cada cosa dentro del sistema para ser más claros
