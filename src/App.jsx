import { useState } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import VideoPreview from './components/VideoPreview'

function App() {
  const [videos, setVideos] = useState([])

  const handleFetchVideo = async (url) => {
    const videoId = Math.random().toString(36).substr(2, 9)
    
    // Add to list immediately as loading
    setVideos(prev => [{
      id: videoId,
      url,
      loading: true,
      error: null,
      data: null
    }, ...prev])

    try {
      const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.code === 0 && data.data) {
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, data: data.data, loading: false } : v
        ))
      } else {
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, error: 'Failed to fetch video. Please check the URL.', loading: false } : v
        ))
      }
    } catch (err) {
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, error: 'An error occurred. Please try again.', loading: false } : v
      ))
    }
  }

  const removeVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  const clearAll = () => {
    setVideos([])
  }

  const downloadAll = async () => {
    for (const video of videos) {
      if (video.data?.play) {
        try {
          const videoUrl = video.data.play
          const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(videoUrl)
          const response = await fetch(proxyUrl)
          if (!response.ok) throw new Error('Fetch failed')
          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = blobUrl
          a.download = (video.data.id || 'tiktok-video') + '.mp4'
          document.body.appendChild(a)
          a.click()
          
          document.body.removeChild(a)
          window.URL.revokeObjectURL(blobUrl)
          
          // Small delay to prevent bottlenecking the browser
          await new Promise(resolve => setTimeout(resolve, 600))
        } catch (err) {
          console.error('Failed to download direct, opening in tab:', err)
          window.open(video.data.play, '_blank')
        }
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <InputSection 
          onFetchVideo={handleFetchVideo} 
        />
        
        {videos.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-white">
              Results ({videos.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={downloadAll}
                className="px-4 py-2 bg-tiktok-cyan/20 text-tiktok-cyan border border-tiktok-cyan/30 rounded-lg text-sm font-medium hover:bg-tiktok-cyan/30 transition-colors"
              >
                Download All
              </button>
              <button 
                onClick={clearAll}
                className="px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg text-sm font-medium hover:text-white hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {videos.map((video) => (
            <VideoPreview 
              key={video.id} 
              videoData={video.data}
              loading={video.loading}
              error={video.error}
              onRemove={() => removeVideo(video.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App;