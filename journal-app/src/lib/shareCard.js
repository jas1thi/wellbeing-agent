/**
 * Generates a beautiful share card image from a journal entry.
 * Returns a Blob URL for the generated PNG.
 */

const CARD_W = 1080
const CARD_H = 1350
const PAD = 80

const COLORS = {
  bg: '#0f0a1a',
  surface: '#1a1128',
  brand: '#8b4dff',
  brandLight: '#c4abff',
  text: '#f0ecf7',
  textMuted: '#a89cc4',
  textDim: '#6b5f85',
  border: '#2d2240',
}

const MOOD_COLORS = {
  great: '#10b981',
  good: '#34d399',
  okay: '#fbbf24',
  low: '#f87171',
  anxious: '#fb923c',
  mixed: '#a78bfa',
}

function classifyMood(mood) {
  if (!mood) return 'mixed'
  const lower = mood.toLowerCase()
  if (/great|amazing|fantastic|excellent|awesome/.test(lower)) return 'great'
  if (/good|positive|happy|solid|relieved/.test(lower)) return 'good'
  if (/okay|ok|alright|fine|neutral/.test(lower)) return 'okay'
  if (/anxious|nervous|stressed/.test(lower)) return 'anxious'
  if (/bad|sad|low|down|rough|tired/.test(lower)) return 'low'
  return 'mixed'
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function generateShareCard(journal) {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Subtle gradient overlay
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  grad.addColorStop(0, 'rgba(139, 77, 255, 0.06)')
  grad.addColorStop(1, 'rgba(139, 77, 255, 0.02)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  let y = PAD

  // Brand mark
  ctx.fillStyle = COLORS.brand
  roundRect(ctx, PAD, y, 44, 44, 12)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('W', PAD + 22, y + 30)
  ctx.textAlign = 'left'

  ctx.fillStyle = COLORS.textDim
  ctx.font = '500 18px Inter, system-ui, sans-serif'
  ctx.fillText('Wellbeing Journal', PAD + 58, y + 28)

  y += 80

  // Date
  const d = new Date(journal.date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  ctx.fillStyle = COLORS.brand
  ctx.font = '600 24px Inter, system-ui, sans-serif'
  ctx.fillText(dateStr, PAD, y)
  y += 16

  // Mood pill
  if (journal.mood) {
    y += 20
    const moodKey = classifyMood(journal.mood)
    const moodColor = MOOD_COLORS[moodKey] || MOOD_COLORS.mixed

    ctx.font = '500 22px Inter, system-ui, sans-serif'
    const moodText = journal.mood
    const moodWidth = ctx.measureText(moodText).width + 32
    const pillH = 38

    ctx.fillStyle = moodColor + '18'
    roundRect(ctx, PAD, y, moodWidth, pillH, 19)
    ctx.fill()

    ctx.strokeStyle = moodColor + '40'
    ctx.lineWidth = 1
    roundRect(ctx, PAD, y, moodWidth, pillH, 19)
    ctx.stroke()

    ctx.fillStyle = moodColor
    ctx.fillText(moodText, PAD + 16, y + 26)
    y += pillH + 16
  }

  // Cartoon image
  if (journal.thumbnail) {
    y += 10
    try {
      const img = await loadImage(`/journals/${journal.thumbnail}`)
      const imgW = CARD_W - PAD * 2
      const imgH = imgW * 0.6
      const imgRadius = 20

      ctx.save()
      roundRect(ctx, PAD, y, imgW, imgH, imgRadius)
      ctx.clip()
      ctx.drawImage(img, PAD, y, imgW, imgH)
      ctx.restore()

      // Subtle border
      ctx.strokeStyle = COLORS.border
      ctx.lineWidth = 1
      roundRect(ctx, PAD, y, imgW, imgH, imgRadius)
      ctx.stroke()

      y += imgH + 30
    } catch {
      y += 10
    }
  } else {
    y += 20
  }

  // Highlights
  if (journal.highlights && journal.highlights.length > 0) {
    ctx.fillStyle = COLORS.textDim
    ctx.font = '600 16px Inter, system-ui, sans-serif'
    ctx.fillText('HIGHLIGHTS', PAD, y)
    y += 28

    ctx.font = '400 22px Inter, system-ui, sans-serif'
    for (const h of journal.highlights.slice(0, 4)) {
      ctx.fillStyle = COLORS.brandLight
      ctx.fillText('·', PAD, y)
      ctx.fillStyle = COLORS.text
      const lines = wrapText(ctx, h, CARD_W - PAD * 2 - 24)
      for (const line of lines) {
        ctx.fillText(line, PAD + 20, y)
        y += 30
      }
      y += 6
    }
    y += 10
  }

  // Reflections (truncated)
  if (journal.reflections) {
    ctx.fillStyle = COLORS.textDim
    ctx.font = '600 16px Inter, system-ui, sans-serif'
    ctx.fillText('REFLECTIONS', PAD, y)
    y += 28

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '400 20px Inter, system-ui, sans-serif'
    const reflLines = wrapText(ctx, journal.reflections, CARD_W - PAD * 2)
    for (const line of reflLines.slice(0, 4)) {
      ctx.fillText(line, PAD, y)
      y += 28
    }
    if (reflLines.length > 4) {
      ctx.fillText('...', PAD, y)
    }
  }

  // Footer
  const footerY = CARD_H - 50
  ctx.fillStyle = COLORS.border
  ctx.fillRect(PAD, footerY - 20, CARD_W - PAD * 2, 1)

  ctx.fillStyle = COLORS.textDim
  ctx.font = '400 16px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Made with Wellbeing Journal — AI-powered daily check-ins', CARD_W / 2, footerY + 8)
  ctx.textAlign = 'left'

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function downloadShareCard(journal) {
  const blob = await generateShareCard(journal)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wellbeing-${journal.date}.png`
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareCard(journal) {
  const blob = await generateShareCard(journal)
  const file = new File([blob], `wellbeing-${journal.date}.png`, { type: 'image/png' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Journal — ${journal.date}`,
    })
  } else {
    // Fallback to download
    await downloadShareCard(journal)
  }
}
