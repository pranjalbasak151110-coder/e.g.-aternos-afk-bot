// leaveRejoin.js
// Handles periodically leaving and rejoining the server. This is useful
// for long-running AFK sessions (e.g. to avoid idle timers, refresh the
// connection, or rotate between accounts in launcher_accounts.json).
//
// It does NOT handle authentication itself — it just tells the caller
// (index.js) when to disconnect and reconnect, and optionally which
// account to use next.

const logger = require('./logger')
const settings = require('./settings.json')
const accountsFile = require('./launcher_accounts.json')

let accountIndex = 0

function getNextAccount() {
  const accounts = accountsFile.accounts || []
  if (accounts.length === 0) return null

  const account = accounts[accountIndex % accounts.length]
  accountIndex++
  return account
}

/**
 * Starts the leave/rejoin cycle.
 * @param {import('mineflayer').Bot} bot - the active bot instance
 * @param {Object} handlers
 * @param {Function} handlers.onCycle - called when it's time to disconnect;
 *   receives the next account (or null) to use on reconnect.
 */
function startLeaveRejoinCycle(bot, { onCycle }) {
  const cfg = settings.leaveRejoin
  if (!cfg?.enabled) {
    logger.info('Leave/rejoin cycling is disabled in settings.json.')
    return
  }

  const sessionMs = (cfg.sessionDurationMinutes ?? 90) * 60 * 1000

  logger.info(
    `Leave/rejoin scheduled: session length ${cfg.sessionDurationMinutes} min, ` +
    `break ${cfg.breakDurationMinutes} min, rotateAccounts=${cfg.rotateAccounts}`
  )

  const timer = setTimeout(() => {
    logger.info('Session duration reached — leaving server.')

    const nextAccount = cfg.rotateAccounts ? getNextAccount() : null
    const breakMs = (cfg.breakDurationMinutes ?? 5) * 60 * 1000

    try {
      bot.quit('Scheduled leave/rejoin cycle')
    } catch (err) {
      logger.warn('Error while quitting bot:', err.message)
    }

    logger.info(`Waiting ${cfg.breakDurationMinutes} min before rejoining...`)
    setTimeout(() => {
      onCycle(nextAccount)
    }, breakMs)
  }, sessionMs)

  // Return a cancel function in case index.js needs to stop the cycle
  // (e.g. on manual shutdown).
  return () => clearTimeout(timer)
}

module.exports = { startLeaveRejoinCycle }
