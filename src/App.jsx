import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Download, ClipboardPaste, Check } from 'lucide-react'
import Header from './components/Header'

function App() {
  const [inputs, setInputs] = useState([''])
  const [statuses, setStatuses] = useState(['idle'])
  const [errors, setErrors] = useState([''])
  const [isDownloading, setIsDownloading] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [autoCatch, setAutoCatch] = useState(false)

  // Auto-Catch Clipboard Watcher (opt-in)
  useEffect(() => {
    if (!autoCatch) return

    const checkClipboard = async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) return
        const text = await navigator.clipboard.readText()
        if (!text) return
        const trimmed = text.trim()
        if (!trimmed.includes('tiktok.com')) return

        setInputs(prev => {
          if (prev.some(u => u.trim() === trimmed)) return prev

          const emptyIdx = prev.findIndex(u => u.trim() === '')
          if (emptyIdx !== -1) {
            const next = [...prev]
            next[emptyIdx] = trimmed
            if (emptyIdx === prev.length - 1 && prev.length < 10) {
              next.push('')
            }
            return next
          } else if (prev.length < 10) {
            return [...prev, trimmed, '']
          }
          return prev
        })
      } catch {
        // Silently fail if clipboard permission is denied or tab is switching
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkClipboard()
      }
    }

    const handleFocus = () => {
      checkClipboard()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [autoCatch])

  const handlePaste = async (index) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return
      const text = await navigator.clipboard.readText()
      if (text) handleInputChange(index, text)
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs]
    newInputs[index] = value

    const newStatuses = [...statuses]
    newStatuses[index] = 'idle'

    const newErrors = [...errors]
    newErrors[index] = ''

    // Auto-expand inputs up to 10 if typing/pasting in the last input
    if (index === inputs.length - 1 && value.trim() !== '' && inputs.length < 10) {
      newInputs.push('')
      newStatuses.push('idle')
      newErrors.push('')
    }

    setInputs(newInputs)
    setStatuses(newStatuses)
    setErrors(newErrors)
  }

  const addInput = () => {
    if (inputs.length >= 10) return
    setInputs([...inputs, ''])
    setStatuses([...statuses, 'idle'])
    setErrors([...errors, ''])
  }

  const removeInput = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index)
    const newStatuses = statuses.filter((_, i) => i !== index)
    const newErrors = errors.filter((_, i) => i !== index)
    setInputs(newInputs.length ? newInputs : [''])
    setStatuses(newStatuses.length ? newStatuses : ['idle'])
    setErrors(newErrors.length ? newErrors : [''])
  }

  const handleClearCompleted = () => {
    const newInputs = []
    const newStatuses = []
    const newErrors = []

    inputs.forEach((url, i) => {
      if (statuses[i] !== 'success') {
        newInputs.push(url)
        newStatuses.push(statuses[i])
        newErrors.push(errors[i])
      }
    })

    if (newInputs.length === 0) {
      setInputs([''])
      setStatuses(['idle'])
      setErrors([''])
    } else {
      if (newInputs[newInputs.length - 1].trim() !== '' && newInputs.length < 10) {
        newInputs.push('')
        newStatuses.push('idle')
        newErrors.push('')
      }
      setInputs(newInputs)
      setStatuses(newStatuses)
      setErrors(newErrors)
    }
  }

  const handleDownloadAll = async (e) => {
    e.preventDefault()

    const activeIndices = []
    inputs.forEach((url, index) => {
      if (url.trim()) activeIndices.push(index)
    })

    if (activeIndices.length === 0) return

    setIsDownloading(true)
    setProgressPercent(0)
    setIsCompleted(false)

    setStatuses(prev => {
      const next = [...prev]
      activeIndices.forEach(idx => next[idx] = 'loading')
      return next
    })
    setErrors(prev => {
      const next = [...prev]
      activeIndices.forEach(idx => next[idx] = '')
      return next
    })

    const queue = [...activeIndices]
    const totalActive = activeIndices.length
    let completedCount = 0
    let apiCallQueue = Promise.resolve()

    const callApiThrottled = (url) => {
      const currentQueue = apiCallQueue
      const deferred = new Promise((resolve, reject) => {
        apiCallQueue = currentQueue
          .then(async () => {
            try {
              const apiResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
              const data = await apiResponse.json()
              resolve(data)
            } catch (err) {
              reject(err)
            }
            await new Promise(r => setTimeout(r, 2500))
          })
          .catch(async () => {
            await new Promise(r => setTimeout(r, 2500))
          })
      })
      return deferred
    }

    const runTask = async (index) => {
      const url = inputs[index].trim()

      try {
        const data = await callApiThrottled(url)

        if (data.code !== 0 || !data.data) {
          throw new Error(data.msg || 'Could not resolve this TikTok link.')
        }

        if (!data.data.play) {
          throw new Error('No playable video found for this TikTok link.')
        }

        const videoId = data.data.id || 'tiktok-video'
        const playUrl = data.data.play

        // Fetch the MP4 and trigger a save dialog
        const fileResponse = await fetch(playUrl)
        if (!fileResponse.ok) {
          throw new Error(`Video server returned ${fileResponse.status}. Please try again.`)
        }

        const blob = await fileResponse.blob()
        const blobUrl = window.URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = blobUrl
        a.download = `${videoId}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(blobUrl)

        setStatuses(prev => {
          const next = [...prev]
          next[index] = 'success'
          return next
        })
      } catch (err) {
        console.error(`Download failed for link ${index + 1}:`, err)
        setStatuses(prev => {
          const next = [...prev]
          next[index] = 'error'
          return next
        })
        setErrors(prev => {
          const next = [...prev]
          next[index] = err.message || 'Download failed'
          return next
        })
      } finally {
        completedCount++
        setProgressPercent(Math.round((completedCount / totalActive) * 100))
      }
    }

    const CONCURRENCY_LIMIT = 3
    const workers = []

    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, queue.length); i++) {
      workers.push((async () => {
        while (queue.length > 0) {
          const index = queue.shift()
          await runTask(index)
        }
      })())
    }

    await Promise.all(workers)
    setIsDownloading(false)
    setIsCompleted(true)

    setTimeout(() => {
      setIsCompleted(false)
      setProgressPercent(0)
    }, 2500)
  }

  const hasMultipleInputs = inputs.length > 1
  const isFormValid = inputs.some(url => url.trim().length > 0)

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#06070B] text-slate-100 flex flex-col justify-between">
      {/* Ambient reactive light halos */}
      <div
        className={`fixed -top-36 -left-36 w-96 h-96 bg-tiktok-cyan/15 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDownloading ? 'opacity-80 scale-125' : 'opacity-25'
        }`}
      />
      <div
        className={`fixed -bottom-36 -right-36 w-96 h-96 bg-tiktok-pink/15 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDownloading ? 'opacity-80 scale-125' : 'opacity-25'
        }`}
      />

      <div>
        <Header />

        <main className="container mx-auto px-4 py-4 sm:py-6 max-w-3xl relative z-10">
          <div
            className={`bg-[#12141D]/80 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-gray-800/80 shadow-2xl transition-all duration-500 ${
              isDownloading ? 'ambient-glow-cyan border-tiktok-cyan/40' : ''
            }`}
          >
            <form onSubmit={handleDownloadAll} className="space-y-4">
              {/* Queue Header with Auto-Catch Toggle */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-800/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Download Queue
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoCatch(prev => !prev)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border active:scale-95 ${
                      autoCatch
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-gray-800 text-gray-400 border-gray-700/60 hover:text-gray-200'
                    }`}
                    title="Automatically add copied TikTok links when returning to this page"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        autoCatch ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    <span>Auto-Catch {autoCatch ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all ${
                    inputs.length >= 10
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-gray-900 text-gray-400 border border-gray-800'
                  }`}
                >
                  {inputs.length}/10 Links
                </span>
              </div>

              {/* Input Rows with spring-in animation */}
              <div className="space-y-3">
                {inputs.map((url, index) => (
                  <div key={index} className="spring-in flex flex-col gap-1">
                    <div className="flex gap-2.5 items-center">
                      <div className="flex-1 relative group">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          placeholder={`Paste TikTok URL ${hasMultipleInputs ? index + 1 : ''} here...`}
                          disabled={isDownloading}
                          className="w-full px-4 py-3.5 bg-[#1A1C28] border border-gray-700/80 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan text-base sm:text-sm font-mono transition-all disabled:opacity-70 pr-24 shadow-inner"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {!url && (
                            <button
                              type="button"
                              onClick={() => handlePaste(index)}
                              disabled={isDownloading}
                              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                              title="Paste from clipboard"
                            >
                              <ClipboardPaste className="w-3.5 h-3.5 text-tiktok-cyan" />
                              <span>Paste</span>
                            </button>
                          )}
                          {statuses[index] === 'loading' && (
                            <Loader2 className="w-5 h-5 text-tiktok-cyan animate-spin" />
                          )}
                          {statuses[index] === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shadow-[0_0_8px_#34d399]" />
                          )}
                          {statuses[index] === 'error' && (
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                      </div>

                      {hasMultipleInputs && (
                        <button
                          type="button"
                          onClick={() => removeInput(index)}
                          disabled={isDownloading}
                          className="p-3 bg-gray-800/80 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-gray-700 rounded-xl transition-all disabled:opacity-50 flex-shrink-0 active:scale-95"
                          title="Remove link"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>

                    {statuses[index] === 'error' && errors[index] && (
                      <p className="text-rose-400 text-xs px-2 mt-0.5">
                        ⚠ {errors[index]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800/60">
                {statuses.includes('success') && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    disabled={isDownloading}
                    className="flex-1 py-3 px-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Completed</span>
                  </button>
                )}

                {inputs.length < 10 && (
                  <button
                    type="button"
                    onClick={addInput}
                    disabled={isDownloading}
                    className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl hover:border-gray-600 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Link</span>
                  </button>
                )}

                {/* Kinetic CTA Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || isDownloading}
                  className={`flex-1 py-3 px-5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-black hover:brightness-110'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      {/* Kinetic SVG Progress Ring */}
                      <svg className="w-5 h-5 text-black" viewBox="0 0 36 36">
                        <path
                          className="text-black/25"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="progress-ring-circle text-black"
                          strokeDasharray="100, 100"
                          style={{ strokeDashoffset: 100 - progressPercent }}
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span>Saving ({progressPercent}%)</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                      <span>All Saved!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>{hasMultipleInputs ? 'Save All Videos' : 'Save Video'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <footer className="py-4 text-center text-gray-500 text-xs relative z-10">
        TikTok Downloader • High-speed video extraction
      </footer>
    </div>
  )
}

export default App