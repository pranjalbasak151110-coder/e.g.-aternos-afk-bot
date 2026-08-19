# Aternos 24/7 AFK Bot

A Minecraft bot (built on [Mineflayer](https://github.com/PrismarineJS/mineflayer))
that connects like a normal player, walks around using physics-based
pathfinding, and periodically cycles leave/rejoin sessions — useful for
keeping a self-hosted or Aternos-style server active.

## Important caveat first

Aternos's Terms of Service prohibit using bots/scripts to keep a free
server artificially online 24/7 — their whole free-tier model depends on
servers going idle and shutting down. Using something like this against
an actual Aternos server risks getting the server or account banned.
This code is legitimate and safe to run against **your own** server
(self-hosted, a VPS, a paid host, or a LAN world) — just be aware of
that restriction if you were planning to point it at Aternos itself.

## File structure

| File                     | Purpose                                                        |
|---------------------------|------------------------------------------------------------------|
| `index.js`                 | Main entry point — connects, wanders, anti-AFK, wires everything |
| `settings.json`            | All configuration (server, account, behavior, logging)           |
| `launcher_accounts.json`   | Template list of accounts for optional account rotation          |
| `leaveRejoin.js`            | Handles scheduled disconnect/reconnect cycling                    |
| `logger.js`                 | Console + file logging helper                                    |
| `package.json`              | Dependencies (`mineflayer`, `mineflayer-pathfinder`)             |
| `.github/dependabot.yml`    | Auto dependency-update PRs on GitHub                               |

`package-lock.json` isn't hand-written — it's generated automatically
the first time you run `npm install`, and should be committed after that
so installs are reproducible.

## Setup

1. Install [Node.js](https://nodejs.org/) v16+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Edit `settings.json`:

   ```json
   {
     "server": {
       "host": "your-server-address",
       "port": 25565
     },
     "account": {
       "type": "offline",
       "username": "AFK_Bot"
     }
   }
   ```

   - Set `account.type` to `"microsoft"` for a premium account — Mineflayer
     will print a device-code login link the first time you run it.
   - Set `account.type` to `"offline"` for cracked/LAN servers that don't
     require authentication.

4. (Optional) If you want account rotation, edit `launcher_accounts.json`
   with the usernames/emails of accounts you own, and set
   `leaveRejoin.rotateAccounts: true` in `settings.json`. **Never store
   plaintext passwords in this file** — Microsoft auth is handled via
   device-code login, not passwords.

5. Run it:

   ```bash
   npm start
   ```

## How it behaves

- **Wandering**: walks to random nearby points using A* pathfinding, so
  it jumps over obstacles and paths around terrain like a real player
  instead of teleporting.
- **Anti-AFK**: jumps periodically (`behavior.jumpIntervalMs`) as a
  lightweight fallback against idle-kick detection.
- **Leave/Rejoin cycling**: if `leaveRejoin.enabled` is `true`, the bot
  disconnects after `sessionDurationMinutes`, waits
  `breakDurationMinutes`, then reconnects (optionally with the next
  account in `launcher_accounts.json`).
- **Chat commands**: say `come here` to summon it to your position,
  `stop` to halt movement.
- **Logging**: writes to console and, if enabled, to `./logs/bot.log`.
- **Auto-reconnect**: reconnects automatically after unexpected
  disconnects (kicks, crashes, network errors).

## Configuration reference (`settings.json`)

```jsonc
{
  "server": { "host": "...", "port": 25565, "version": false },
  "account": { "type": "offline", "username": "AFK_Bot" },
  "behavior": {
    "wander": true,
    "wanderRadius": 15,
    "antiAfk": true,
    "jumpIntervalMs": 30000
  },
  "leaveRejoin": {
    "enabled": true,
    "sessionDurationMinutes": 90,
    "breakDurationMinutes": 5,
    "rotateAccounts": false
  },
  "logging": { "level": "info", "logToFile": true, "logFilePath": "./logs/bot.log" },
  "reconnect": { "enabled": true, "delayMs": 5000, "maxRetries": 10 }
}
```

## License

MIT
