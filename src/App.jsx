import { useState } from 'react'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import Header from './components/Header'
import { applyFastStart, renderSlideshowToVideo } from './utils/ffmpegHelper'

function App() {
  const [inputs, setInputs] = useState([''])
  const [statuses, setStatuses] = useState(['idle'])
  const [errors, setErrors] = useState([''])
  const [isDownloading, setIsDownloading] = useState(false)
  const [slideshowData, setSlideshowData] = useState({})

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs]
    newInputs[index] = value

    const newStatuses = [...statuses]
    newStatuses[index] = 'idle'

    const newErrors = [...errors]
    newErrors[index] = ''

    setSlideshowData(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })

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

    setSlideshowData(prev => {
      const next = {}
      let targetIdx = 0
      inputs.forEach((_, i) => {
        if (i !== index) {
          if (prev[i]) {
            next[targetIdx] = prev[i]
          }
          targetIdx++
        }
      })
      return next
    })

    setInputs(newInputs.length ? newInputs : [''])
    setStatuses(newStatuses.length ? newStatuses : ['idle'])
    setErrors(newErrors.length ? newErrors : [''])
  }

  const handleClearCompleted = () => {
    const newInputs = []
    const newStatuses = []
    const newErrors = []
    const newSlideshowData = {}

    inputs.forEach((url, i) => {
      if (statuses[i] !== 'success') {
        newInputs.push(url)
        newStatuses.push(statuses[i])
        newErrors.push(errors[i])
        if (slideshowData[i]) {
          newSlideshowData[newInputs.length - 1] = slideshowData[i]
        }
      }
    })

    if (newInputs.length === 0) {
      setInputs([''])
      setStatuses(['idle'])
      setErrors([''])
      setSlideshowData({})
    } else {
      if (newInputs[newInputs.length - 1].trim() !== '' && newInputs.length < 10) {
        newInputs.push('')
        newStatuses.push('idle')
        newErrors.push('')
      }
      setInputs(newInputs)
      setStatuses(newStatuses)
      setErrors(newErrors)
      setSlideshowData(newSlideshowData)
    }
  }

  const handleDownloadPhotos = async (index) => {
    const data = slideshowData[index]
    if (!data) return

    setIsDownloading(true)
    setStatuses(prev => {
      const next = [...prev]
      next[index] = 'loading'
      return next
    })
    setErrors(prev => {
      const next = [...prev]
      next[index] = ''
      return next
    })

    try {
      const JSZipModule = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')
      const JSZip = JSZipModule.default
      const zip = new JSZip()

      for (let i = 0; i < data.images.length; i++) {
        const res = await fetch(data.images[i])
        if (!res.ok) throw new Error(`Failed to download image ${i + 1}`)
        const blob = await res.blob()
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        let ext = 'jpg'
        if (contentType.includes('png')) ext = 'png'
        else if (contentType.includes('webp')) ext = 'webp'
        
        zip.file(`image_${i + 1}.${ext}`, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const blobUrl = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = `${data.id}_photos.zip`
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
      console.error(err)
      setStatuses(prev => {
        const next = [...prev]
        next[index] = 'choices'
        return next
      })
      setErrors(prev => {
        const next = [...prev]
        next[index] = err.message || 'Failed to download photos'
        return next
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRenderVideo = async (index) => {
    const data = slideshowData[index]
    if (!data) return

    setIsDownloading(true)
    setStatuses(prev => {
      const next = [...prev]
      next[index] = 'loading'
      return next
    })
    setErrors(prev => {
      const next = [...prev]
      next[index] = ''
      return next
    })

    try {
      const videoBlob = await renderSlideshowToVideo(data.images, data.music, 3)
      const blobUrl = window.URL.createObjectURL(videoBlob)

      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = `${data.id}_slideshow.mp4`
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
      console.error(err)
      setStatuses(prev => {
        const next = [...prev]
        next[index] = 'choices'
        return next
      })
      setErrors(prev => {
        const next = [...prev]
        next[index] = err.message || 'Failed to render slideshow'
        return next
      })
    } finally {
      setIsDownloading(false)
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
        // Step 1: Resolve the TikTok URL via TikWM (throttled)
        const data = await callApiThrottled(url)

        if (data.code !== 0 || !data.data) {
          throw new Error(data.msg || 'Could not resolve this TikTok link.')
        }

        const videoId = data.data.id || 'tiktok-video'

        // Check if this is a slideshow (photo post)
        if (data.data.images && data.data.images.length > 0) {
          setSlideshowData(prev => ({
            ...prev,
            [index]: {
              images: data.data.images,
              music: data.data.music || (data.data.music_info && data.data.music_info.play),
              id: videoId
            }
          }))
          setStatuses(prev => {
            const next = [...prev]
            next[index] = 'choices'
            return next
          })
          return
        }

        if (!data.data.play) {
          throw new Error('No playable video found for this TikTok link.')
        }

        const playUrl = data.data.play

        // Step 2: Fetch the MP4 directly from TikTok CDN
        const fileResponse = await fetch(playUrl)
        if (!fileResponse.ok) {
          throw new Error(`Video server returned ${fileResponse.status}. Please try again.`)
        }

        const blob = await fileResponse.blob()

        // Fix moov atom + faststart so iPhone plays it natively
        const optimizedBlob = await applyFastStart(blob)
        const blobUrl = window.URL.createObjectURL(optimizedBlob)

        // Step 3: Trigger browser save dialog
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
  }

  const hasMultipleInputs = inputs.length > 1
  const isFormValid = inputs.some(url => url.trim().length > 0)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="bg-tiktok-gray/40 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-800">
          <form onSubmit={handleDownloadAll} className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800/40">
              <span className="text-sm font-medium text-gray-400">Download Queue</span>
              <span className={`text-xs px-2 py-1 rounded-md font-mono ${inputs.length >= 10 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-400'}`}>
                {inputs.length}/10 Links
              </span>
            </div>
            {inputs.map((url, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      placeholder={`Paste TikTok URL ${hasMultipleInputs ? index + 1 : ''} here...`}
                      disabled={isDownloading}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-tiktok-gray border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan text-sm sm:text-base transition-all disabled:opacity-70 pr-12"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {statuses[index] === 'loading' && (
                        <Loader2 className="w-5 h-5 text-tiktok-cyan animate-spin" />
                      )}
                      {statuses[index] === 'choices' && (
                        <CheckCircle2 className="w-5 h-5 text-tiktok-cyan" />
                      )}
                      {statuses[index] === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                      {statuses[index] === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {hasMultipleInputs && (
                    <button
                      type="button"
                      onClick={() => removeInput(index)}
                      disabled={isDownloading}
                      className="p-3 bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                      title="Remove link"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {statuses[index] === 'choices' && slideshowData[index] && (
                  <div className="mt-2 p-4 bg-tiktok-gray/60 border border-gray-800/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-white">Slideshow Detected</span>
                      <span className="text-xs text-gray-400">
                        This link contains {slideshowData[index].images.length} photos with background music.
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleDownloadPhotos(index)}
                        disabled={isDownloading}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-lg hover:border-gray-600 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        Download Photos ({slideshowData[index].images.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRenderVideo(index)}
                        disabled={isDownloading}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white rounded-lg hover:opacity-90 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        Render Slideshow (MP4)
                      </button>
                    </div>
                  </div>
                )}

                {statuses[index] === 'error' && errors[index] && (
                  <p className="text-red-400 text-xs px-2">
                    ⚠ {errors[index]}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800/60">
              {statuses.includes('success') && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  disabled={isDownloading}
                  className="flex-1 py-3 px-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Completed
                </button>
              )}

              {inputs.length < 10 && (
                <button
                  type="button"
                  onClick={addInput}
                  disabled={isDownloading}
                  className="flex-1 py-3 px-4 bg-gray-800 text-white border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isDownloading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{hasMultipleInputs ? 'Download All' : 'Download'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App