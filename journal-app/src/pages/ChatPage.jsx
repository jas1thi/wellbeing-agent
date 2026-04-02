import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { createSession, listSessions, deleteSession, sendMessageSSE, getSession } from '../lib/api'

export default function ChatPage() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const cancelRef = useRef(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function loadSessions() {
    try {
      const data = await listSessions()
      const sorted = (data || []).sort(
        (a, b) => new Date(b.last_update_time || b.created_timestamp || 0) - new Date(a.last_update_time || a.created_timestamp || 0)
      )
      setSessions(sorted)

      // Auto-select most recent session
      if (sorted.length > 0 && !activeSessionId) {
        selectSession(sorted[0].id)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoadingSessions(false)
    }
  }

  async function selectSession(sessionId) {
    setActiveSessionId(sessionId)
    setMessages([])
    setError(null)

    try {
      const session = await getSession(sessionId)
      const msgs = (session.events || [])
        .filter(e => e.content?.parts?.some(p => p.text))
        .map(e => ({
          role: e.author === 'user' ? 'user' : 'agent',
          text: e.content.parts.filter(p => p.text).map(p => p.text).join('\n'),
        }))
      setMessages(msgs)

      // Update session name in sidebar
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s
        const firstUserMsg = msgs.find(m => m.role === 'user')
        if (firstUserMsg) {
          return { ...s, _name: firstUserMsg.text.slice(0, 40) }
        }
        return s
      }))
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  async function handleNewSession() {
    try {
      const session = await createSession()
      setSessions(prev => [session, ...prev])
      setActiveSessionId(session.id)
      setMessages([])
      setError(null)
      inputRef.current?.focus()
    } catch (err) {
      setError('Failed to create session. Is the backend running on port 8000?')
    }
  }

  async function handleDeleteSession(sessionId, e) {
    e.stopPropagation()
    try {
      await deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  function handleSend() {
    if (!input.trim() || sending || !activeSessionId) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setSending(true)

    // Name the session after first user message
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId || s._name) return s
      return { ...s, _name: userMsg.slice(0, 40) }
    }))
    setStreamingText('')
    setError(null)

    cancelRef.current = sendMessageSSE(
      activeSessionId,
      userMsg,
      (text) => {
        // Streaming text update
        setStreamingText(text)
      },
      (finalText) => {
        // Done
        if (finalText) {
          setMessages(prev => [...prev, { role: 'agent', text: finalText }])
        }
        setStreamingText('')
        setSending(false)
      },
      (err) => {
        setError(err.message || 'Failed to get response. Is the backend running?')
        setSending(false)
        setStreamingText('')
      }
    )
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <PageWrapper className="!max-w-full !px-0 !py-0 h-screen">
      <div className="flex h-full">
        {/* Session sidebar */}
        <div className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <button
              onClick={handleNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              New Check-in
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="text-text-muted animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8 px-4">
                No conversations yet. Start a new check-in.
              </p>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all group flex items-center gap-2 ${
                    activeSessionId === session.id
                      ? 'bg-brand-600/15 text-brand-400'
                      : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                  }`}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="flex-1 truncate">
                    {session._name || formatSessionLabel(session)}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeSessionId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
                  <MessageSquare size={24} className="text-brand-400" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Wellbeing Check-in
                </h2>
                <p className="text-sm text-text-muted mb-6 leading-relaxed">
                  Have a quick conversation about your day. The agent will listen,
                  ask a few questions, and save a journal entry with a cartoon of your highlights.
                </p>
                <button
                  onClick={handleNewSession}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start a Check-in
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {messages.length === 0 && !sending && (
                  <div className="text-center py-16">
                    <p className="text-text-muted text-sm">
                      Say hello to start your daily check-in.
                    </p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3.5 ${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-raised border border-border'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="text-sm leading-relaxed [&_p]:text-text-secondary [&_strong]:text-text-primary">
                            <MarkdownRenderer content={msg.text} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Streaming response */}
                {streamingText && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[70%] rounded-2xl px-5 py-3.5 bg-surface-raised border border-border">
                      <div className="text-sm leading-relaxed [&_p]:text-text-secondary [&_strong]:text-text-primary">
                        <MarkdownRenderer content={streamingText} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator */}
                {sending && !streamingText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl px-5 py-4 bg-surface-raised border border-border">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <div className="text-center">
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 inline-block">
                      {error}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="max-w-3xl mx-auto flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="How was your day?"
                      rows={1}
                      className="w-full resize-none bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      onInput={e => {
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="p-3 bg-brand-600 hover:bg-brand-500 disabled:bg-surface-overlay disabled:text-text-muted text-white rounded-xl transition-colors shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function formatSessionLabel(session) {
  const ts = session.last_update_time || session.created_timestamp
  if (!ts) return 'New check-in'
  try {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    }

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch {
    return 'Check-in'
  }
}
