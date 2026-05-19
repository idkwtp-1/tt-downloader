import { useState } from 'react'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react'
import Header from './components/Header'

function App() {
  const [inputs, setInputs] = useState([''])
  const [statuses, setStatuses] = useState(['idle']) // 'idle', 'loading', 'success', 'error'
  const [errors, setErrors] = useState([''])
  const [isDownloading, setIsDownloading] = useState(false)

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
    
    // Reset status for this input
    const newStatuses = [...statuses]
    newStatuses[index] = 'idle'
    setStatuses(newStatuses)
    
    const newErrors = [...errors]
    newErrors[index] = ''
    setErrors(newErrors)
  }

  const addInput = () => {
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

  const handleDownloadAll = async (e) => {
    e.preventDefault()
    
    // Filter out empty URLs
    const activeIndices = []
    inputs.forEach((url, index) => {
      if (url.trim()) activeIndices.push(index)
    })

    if (activeIndices.length === 0) return

    setIsDownloading(true)

    // Set active ones to loading
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

    for (let count = 0; count < activeIndices.length; count++) {
      const index = activeIndices[count]
      const url = inputs[index].trim()

      try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
        const data = await response.json()

        if (data.code === 0 && data.data && data.data.play) {
          const playUrl = data.data.play
          const videoId = data.data.id || 'tiktok-video'
          
          // Setup direct download headers with proxy
          const filename = `${videoId}.mp4`
          const resHeaders = `content-disposition:attachment; filename="${filename}"`
          const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(playUrl)}&resHeaders=${encodeURIComponent(resHeaders)}`
          
          // Trigger download via iframe
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.src = proxyUrl
          document.body.appendChild(iframe)
          setTimeout(() => document.body.removeChild(iframe), 5000)

          setStatuses(prev => {
            const next = [...prev]
            next[index] = 'success'
            return next
          })
        } else {
          throw new Error(data.msg || 'Unable to parse download link.')
        }
      } catch (err) {
        console.error('Download failed for index', index, err)
        setStatuses(prev => {
          const next = [...prev]
          next[index] = 'error'
          return next
        })
        setErrors(prev => {
          const next = [...prev]
          next[index] = err.message || 'Fetch failed'
          return next
        })
      }

      // Sequential request throttle delay
      if (count < activeIndices.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }

    setIsDownloading(false)
  }

  const hasMultipleInputs = inputs.length > 1
  const isFormValid = inputs.some(url => url.trim().length > 0)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="bg-tiktok-gray/40 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
          <form onSubmit={handleDownloadAll} className="space-y-4">
            {inputs.map((url, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      placeholder={`Paste TikTok video URL ${hasMultipleInputs ? index + 1 : ''} here...`}
                      disabled={isDownloading}
                      className="w-full px-5 py-4 bg-tiktok-gray border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan transition-all disabled:opacity-70"
                    />
                    
                    {/* Status Icons */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {statuses[index] === 'loading' && (
                        <Loader2 className="w-5 h-5 text-tiktok-cyan animate-spin" />
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
                      className="p-4 bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 rounded-xl transition-all disabled:opacity-50"
                      title="Remove link"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Error message */}
                {statuses[index] === 'error' && errors[index] && (
                  <p className="text-red-400 text-xs px-2 mt-1">
                    Error: {errors[index]}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-800/60">
              <button
                type="button"
                onClick={addInput}
                disabled={isDownloading}
                className="px-6 py-4 bg-gray-800 text-white border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Add Link
              </button>
              
              <button
                type="submit"
                disabled={!isFormValid || isDownloading}
                className="px-8 py-4 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white font-semibold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
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

export default App;