import { useState } from 'react'
import Header from './components/Header'
import InputSection from './components/InputSection'
import VideoPreview from './components/VideoPreview'

function App() {
  const [videoData, setVideoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFetchVideo = async (url) => {
    setLoading(true)
    setError('')
    setVideoData(null)

    try {
      const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.code === 0 && data.data) {
        setVideoData(data.data)
      } else {
        setError('Failed to fetch video. Please check the URL and try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <InputSection 
          onFetchVideo={handleFetchVideo} 
          loading={loading}
          error={error}
        />
        {videoData && (
          <VideoPreview videoData={videoData} />
        )}
      </div>
    </div>
  )
}

export default App
