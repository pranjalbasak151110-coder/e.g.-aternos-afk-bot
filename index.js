// index.js
// Main entry point. Connects to the Minecraft server, walks around
// like a normal player (physics-based pathfinding, not teleporting),
// periodically jumps/moves to avoid AFK-kicks, and optionally cycles
// leave/rejoin sessions via leaveRejoin.js.

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const logger = require('./logger')
const settings = require('./settings.json')
const { startLeaveRejoinCycle } = require('./leaveRejoin')

let cancelCycle = null

function createBot(accountOverride = null) {
  const username = accountOverride?.username || settings.account.username
  const authType = accountOverride?.authType || settings.account.type

  logger.info(`Connecting to ${settings.server.host}:${settings.server.port} as "${username}" (auth: ${authType})`)

  const bot = mineflayer.createBot({
    host: settings.server.host,
    port: settings.server.port,
    username,
    auth: authType,
    version: settings.server.version
  })

  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    logger.info('Bot spawned successfully.')

    const movements = new Movements(bot)
    movements.canDig = false
    movements.allowParkour = true
    bot.pathfinder.setMovements(movements)

    if (settings.behavior.wander) {
      startWandering(bot)
    }

    if (settings.behavior.antiAfk) {
      startAntiAfk(bot)
    }

    if (settings.leaveRejoin.enabled) {
      cancelCycle = startLeaveRejoinCycle(bot, {
        onCycle: (nextAccount) => createBot(nextAccount)
      })
    }
  })

  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    logger.debug(`<${username}> ${message}`)

    if (message.toLowerCase() === 'come here') {
      const target = bot.players[username]?.entity
      if (target) {
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
        bot.chat(`Coming, ${username}!`)
      }
    }

    if (message.toLowerCase() === 'stop') {
      bot.pathfinder.setGoal(null)
      bot.chat('Stopped.')
    }
  })

  bot.on('kicked', (reason) => logger.warn('Kicked from server:', reason))
  bot.on('error', (err) => logger.error('Bot error:', err.message))

  bot.on('end', () => {
    logger.info('Disconnected from server.')
    if (cancelCycle) cancelCycle()

    if (settings.reconnect.enabled) {
      logger.info(`Reconnecting in ${settings.reconnect.delayMs / 1000}s...`)
      setTimeout(() => createBot(accountOverride), settings.reconnect.delayMs)
    }
  })

  return bot
}

// Wanders to random nearby points using pathfinder, so the bot walks
// and jumps like a real player rather than teleporting.
function startWandering(bot) {
  const radius = settings.behavior.wanderRadius ?? 15

  function wanderStep() {
    if (!bot.entity) return

    const pos = bot.entity.position
    const dx = Math.floor((Math.random() * 2 - 1) * radius)
    const dz = Math.floor((Math.random() * 2 - 1) * radius)

    const goal = new goals.GoalNear(
      Math.floor(pos.x) + dx,
      pos.y,
      Math.floor(pos.z) + dz,
      1
    )

    bot.pathfinder.setGoal(goal)

    const wait = 4000 + Math.random() * 5000
    setTimeout(wanderStep, wait)
  }

  wanderStep()
}

// Periodically makes the bot jump in place. Useful as a lightweight
// anti-AFK measure alongside wandering, especially if wandering is
// disabled or the bot is stuck.
function startAntiAfk(bot) {
  const interval = settings.behavior.jumpIntervalMs ?? 30000

  setInterval(() => {
    if (!bot.entity) return
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 500)
  }, interval)
}

createBot()
