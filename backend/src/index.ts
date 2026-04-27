import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import cron from 'node-cron'
import { prisma } from './lib/prisma.js'
import { discordDailyReport } from './lib/discord.js'
import { buildReportData } from './routes/settings.js'
import { startBot, sendReportToChannel } from './lib/bot.js'
import auth from './routes/auth.js'
import requests from './routes/requests.js'
import users from './routes/users.js'
import audit from './routes/audit.js'
import files from './routes/files.js'
import settings from './routes/settings.js'

const app = new Hono()

app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3456',
    'http://10.29.112.35:5173',
    'http://10.29.112.35:3456',
  ],
  credentials: true,
}))
app.use('*', logger())

app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }))

app.route('/api/auth', auth)
app.route('/api/requests', requests)
app.route('/api/users', users)
app.route('/api/audit', audit)
app.route('/api/files', files)
app.route('/api/settings', settings)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3000')
serve({ fetch: app.fetch, port }, () => {
  console.log(`✅ Backend running → http://localhost:${port}`)
  console.log(`📋 Health check  → http://localhost:${port}/health`)
})

// ─── Auto-start bot if token is saved ─────────────────────────────
prisma.settings.findUnique({ where: { id: 'singleton' } }).then(s => {
  if (s?.discordBotToken) {
    startBot(s.discordBotToken).catch(e => console.error('[bot] auto-start failed:', e.message))
  }
}).catch(console.error)

// ─── Daily report cron ────────────────────────────────────────────
// ทุกนาที ตรวจว่าถึงเวลาส่งรายงานหรือยัง (HH:MM ตรงกับ discordReportTime)
cron.schedule('* * * * *', async () => {
  try {
    const s = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    if (!s?.discordWebhook || !s.discordReportEnabled || !s.discordReportTime) return
    const now = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok',
    })
    if (now !== s.discordReportTime) return
    const data = await buildReportData(s.siteName)
    if (s.discordChannelId && s.discordBotToken) {
      await sendReportToChannel(s.discordChannelId, data)
    } else if (s.discordWebhook) {
      await discordDailyReport(s.discordWebhook, data)
    }
    console.log(`[cron] daily report sent at ${now}`)
  } catch (e: any) {
    console.error('[cron] daily report error:', e.message)
  }
}, { timezone: 'Asia/Bangkok' })
