const isDev = import.meta.env.DEV
const API_BASE = '/api'
const ADK_BASE = isDev ? '/adk' : ''

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, opts)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export function getJournals() {
  return fetchJSON('/journals')
}

export function getJournal(slug) {
  return fetchJSON(`/journals/${slug}`)
}

export function getStats() {
  return fetchJSON('/stats')
}

export function searchJournals(query, topK = 5, signal) {
  return fetchJSON(`/search?q=${encodeURIComponent(query)}&top_k=${topK}`, { signal })
}

export function getCalendar(year, month) {
  const params = new URLSearchParams()
  if (year) params.set('year', year)
  if (month) params.set('month', month)
  return fetchJSON(`/calendar?${params}`)
}

// --- ADK Agent Chat ---

const APP_NAME = 'wellbeing_agent'
const USER_ID = 'web-user'

export async function createSession() {
  const res = await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${USER_ID}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function listSessions() {
  const res = await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${USER_ID}/sessions`)
  if (!res.ok) throw new Error('Failed to list sessions')
  return res.json()
}

export async function getSession(sessionId) {
  const res = await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Failed to get session')
  return res.json()
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${USER_ID}/sessions/${sessionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete session')
}

export function sendMessageSSE(sessionId, message, onText, onDone, onError) {
  const controller = new AbortController()

  fetch(`${ADK_BASE}/run_sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_name: APP_NAME,
      user_id: USER_ID,
      session_id: sessionId,
      streaming: true,
      new_message: {
        parts: [{ text: message }],
      },
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        onError?.(new Error(`Agent error: ${res.status}`))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          let event
          try { event = JSON.parse(trimmed.slice(6)) } catch { continue }

          // Skip non-agent events
          if (!event.content?.parts) continue

          // The final non-partial event contains the full accumulated text
          if (event.partial === false) {
            fullText = ''
            for (const part of event.content.parts) {
              if (part.text) fullText += part.text
            }
            onText?.(fullText)
            continue
          }

          // Partial streaming chunks — accumulate text
          if (event.partial === true) {
            for (const part of event.content.parts) {
              if (part.text) {
                fullText += part.text
              }
            }
            onText?.(fullText)
          }
        }
      }

      onDone?.(fullText)
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError?.(err)
    })

  return () => controller.abort()
}
