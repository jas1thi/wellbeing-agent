import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Loader2 } from 'lucide-react'
import { generateShareCard, downloadShareCard, shareCard } from '../lib/shareCard'

export default function SharePreview({ journal, isOpen, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (isOpen && journal) {
      setGenerating(true)
      generateShareCard(journal)
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        })
        .catch(console.error)
        .finally(() => setGenerating(false))
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [isOpen, journal])

  async function handleDownload() {
    setSharing(true)
    try {
      await downloadShareCard(journal)
    } finally {
      setSharing(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      await shareCard(journal)
    } finally {
      setSharing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 top-[5%] left-1/2 -translate-x-1/2 w-full max-w-md"
          >
            <div className="bg-surface-raised border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Share Entry</h3>
                <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Preview */}
              <div className="p-5">
                <div className="rounded-xl overflow-hidden bg-surface-overlay border border-border aspect-[1080/1350]">
                  {generating ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 size={24} className="text-brand-400 animate-spin" />
                    </div>
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="Share card preview" className="w-full h-full object-contain" />
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={handleDownload}
                  disabled={generating || sharing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-overlay border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-raised transition-colors disabled:opacity-50"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  disabled={generating || sharing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {sharing ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                  Share
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
