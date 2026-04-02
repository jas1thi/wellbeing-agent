import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

const journalsDir = path.resolve(__dirname, '../journals')

function journalsApiPlugin() {
  return {
    name: 'journals-api-plugin',
    configureServer(server) {
      // GET /api/journals — list all entries
      server.middlewares.use('/api/journals', (req, res, next) => {
        // Only handle exact path or trailing slash
        const url = new URL(req.url, 'http://localhost')
        const subPath = url.pathname.replace(/^\/api\/journals\/?/, '')

        if (req.method !== 'GET') return next()

        // Single journal by slug
        if (subPath && subPath !== '/') {
          const slug = subPath.replace(/^\//, '')
          const filePath = path.join(journalsDir, `${slug}.md`)
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ detail: 'Not found' }))
          }
          const parsed = parseJournal(filePath, slug)
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify(parsed))
        }

        // List all journals
        if (!fs.existsSync(journalsDir)) {
          res.setHeader('Content-Type', 'application/json')
          return res.end('[]')
        }

        const files = fs.readdirSync(journalsDir)
        const mdFiles = files.filter(f => f.endsWith('.md') && f !== '.gitkeep').sort().reverse()

        const journals = mdFiles.map(file => {
          const slug = file.replace('.md', '')
          return parseJournal(path.join(journalsDir, file), slug)
        })

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(journals))
      })

      // GET /api/stats — mood analytics
      server.middlewares.use('/api/stats', (req, res, next) => {
        if (req.method !== 'GET') return next()

        if (!fs.existsSync(journalsDir)) {
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({
            total_entries: 0,
            entries_this_month: 0,
            current_streak: 0,
            longest_streak: 0,
            mood_distribution: {},
            recent_moods: [],
          }))
        }

        const files = fs.readdirSync(journalsDir)
          .filter(f => f.endsWith('.md') && f !== '.gitkeep')
          .sort()
          .reverse()

        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const entries = files.map(file => {
          const slug = file.replace('.md', '')
          return parseJournal(path.join(journalsDir, file), slug)
        })

        const thisMonth = entries.filter(e => e.date.startsWith(currentMonth)).length

        // Mood distribution
        const moodDist = {}
        for (const e of entries) {
          if (e.mood) {
            const lower = e.mood.toLowerCase()
            let key = 'Mixed'
            if (/great|amazing|fantastic|excellent/.test(lower)) key = 'Great'
            else if (/good|positive|happy/.test(lower)) key = 'Good'
            else if (/okay|ok|alright|fine|neutral/.test(lower)) key = 'Okay'
            else if (/bad|sad|low|down|rough/.test(lower)) key = 'Low'
            else if (/anxious|nervous|stressed/.test(lower)) key = 'Anxious'
            moodDist[key] = (moodDist[key] || 0) + 1
          }
        }

        // Streaks
        const dates = new Set()
        for (const e of entries) {
          const m = e.date.match(/^\d{4}-\d{2}-\d{2}$/)
          if (m) dates.add(e.date)
        }

        let currentStreak = 0
        const today = now.toISOString().slice(0, 10)
        let d = new Date(today + 'T00:00:00')
        while (dates.has(d.toISOString().slice(0, 10))) {
          currentStreak++
          d.setDate(d.getDate() - 1)
        }
        if (currentStreak === 0) {
          d = new Date(today + 'T00:00:00')
          d.setDate(d.getDate() - 1)
          while (dates.has(d.toISOString().slice(0, 10))) {
            currentStreak++
            d.setDate(d.getDate() - 1)
          }
        }

        const sortedDates = [...dates].sort()
        let longestStreak = 0
        let streak = 1
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1] + 'T00:00:00')
          const curr = new Date(sortedDates[i] + 'T00:00:00')
          if ((curr - prev) / 86400000 === 1) {
            streak++
          } else {
            longestStreak = Math.max(longestStreak, streak)
            streak = 1
          }
        }
        longestStreak = Math.max(longestStreak, streak)
        if (sortedDates.length === 0) longestStreak = 0

        const recentMoods = entries
          .filter(e => e.mood)
          .slice(0, 14)
          .map(e => ({ date: e.date, mood: e.mood, slug: e.slug }))

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          total_entries: entries.length,
          entries_this_month: thisMonth,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          mood_distribution: moodDist,
          recent_moods: recentMoods,
        }))
      })

      // GET /api/calendar — entries by month
      server.middlewares.use('/api/calendar', (req, res, next) => {
        if (req.method !== 'GET') return next()

        const url = new URL(req.url, 'http://localhost')
        const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear()
        const month = parseInt(url.searchParams.get('month')) || (new Date().getMonth() + 1)
        const prefix = `${year}-${String(month).padStart(2, '0')}`

        if (!fs.existsSync(journalsDir)) {
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ year, month, entries: [] }))
        }

        const files = fs.readdirSync(journalsDir)
          .filter(f => f.endsWith('.md') && f !== '.gitkeep' && f.startsWith(prefix))
          .sort()

        const entries = files.map(file => {
          const slug = file.replace('.md', '')
          const parsed = parseJournal(path.join(journalsDir, file), slug)
          return { date: parsed.date, slug: parsed.slug, title: parsed.title, mood: parsed.mood }
        })

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ year, month, entries }))
      })

      // Serve journal images
      server.middlewares.use('/journals', (req, res, next) => {
        const filePath = path.join(journalsDir, decodeURIComponent(req.url).replace(/^\//, ''))
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          return res.end(fs.readFileSync(filePath))
        }
        next()
      })
    },
  }
}

function parseJournal(filePath, slug) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/)
  const date = dateMatch ? dateMatch[1] : slug

  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : date

  const moodMatch = content.match(/\*\*Mood:?\*\*:?\s*(.+)/i) ||
    content.match(/\*\*Mood\*\*[:\s]+(.+)/i) ||
    content.match(/##\s*Mood\n(.+)/i) ||
    content.match(/##\s*How I'm Feeling\n(.+)/i)
  let mood = moodMatch ? moodMatch[1].trim() : null
  // Truncate long mood descriptions to first sentence
  if (mood && mood.length > 60) {
    const firstSentence = mood.match(/^[^.!]+[.!]/)
    mood = firstSentence ? firstSentence[0].trim() : mood.slice(0, 60) + '...'
  }

  const imgMatch = content.match(/!\[.*?\]\(([^)]+)\)/)
  let thumbnail = imgMatch ? imgMatch[1] : null
  if (thumbnail) thumbnail = thumbnail.replace(/^\.\//, '')

  // Parse highlights
  const highlights = []
  let inHighlights = false
  for (const line of content.split('\n')) {
    if (/\*\*Highlights?:?\*\*/i.test(line) || /##\s*Highlights?/i.test(line)) {
      inHighlights = true
      continue
    }
    if (inHighlights) {
      if (/^[-*]\s+/.test(line)) {
        highlights.push(line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
      } else if (/^(\*\*|##|---)/.test(line.trim())) {
        inHighlights = false
      }
    }
  }

  return { slug, date, title, mood, thumbnail, highlights, content }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), journalsApiPlugin()],
  server: {
    proxy: {
      '/api/search': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/adk': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/adk/, ''),
      },
    },
  },
})
