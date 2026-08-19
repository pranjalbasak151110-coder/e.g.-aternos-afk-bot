// logger.js
// Small logging helper: prints to console with timestamps/levels,
// and optionally appends to a log file (configured in settings.json).

const fs = require('fs')
const path = require('path')
const settings = require('./settings.json')

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel = LEVELS[settings.logging?.level] ?? LEVELS.info

let logFileStream = null

if (settings.logging?.logToFile) {
  const logPath = settings.logging.logFilePath || './logs/bot.log'
  const dir = path.dirname(logPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  logFileStream = fs.createWriteStream(logPath, { flags: 'a' })
}

function timestamp() {
  return new Date().toISOString()
}

function write(level, ...args) {
  if (LEVELS[level] < currentLevel) return

  const line = `[${timestamp()}] [${level.toUpperCase()}] ${args.join(' ')}`

  const consoleFn = level === 'error' ? console.error
    : level === 'warn' ? console.warn
      : console.log

  consoleFn(line)

  if (logFileStream) {
    logFileStream.write(line + '\n')
  }
}

module.exports = {
  debug: (...args) => write('debug', ...args),
  info: (...args) => write('info', ...args),
  warn: (...args) => write('warn', ...args),
  error: (...args) => write('error', ...args)
}
