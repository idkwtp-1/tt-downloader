import { Download, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

function VideoPreview({ videoData, loading, error, onRemove }) {
  const [downloadingFile, setDownloadingFile] = useState(false)

  const handleDownload = async (e) => {
    e.preventDefault()
    if (!videoData.play) return

    setDownloadingFile(true)
    try {
      const videoUrl = videoData.play
      // Use corsproxy.io to bypass CORS for fetching the MP4 blob directly
      const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(videoUrl)
      
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = (videoData.id || 'tiktok-video') + '.mp4'
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Direct download failed, falling back to opening in a new tab:', err)
      // Fallback: Open in a new tab
      window.open(videoData.play, '_blank')
    } finally {
      setDownloadingFile(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-tiktok-gray rounded-2xl p-6 border border-gray-800 flex flex-col items-center justify-center min-h-[200px] relative">
        <button 
          onClick={onRemove}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <Loader2 className="w-8 h-8 text-tiktok-cyan animate-spin mb-4" />
        <p className="text-gray-400">Fetching video details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-tiktok-gray rounded-2xl p-6 border border-red-500/30 flex flex-col items-center justify-center min-h-[150px] relative">
        <button 
          onClick={onRemove}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-red-400 mb-2">Error</p>
        <p className="text-gray-400 text-center">{error}</p>
      </div>
    )
  }

  if (!videoData) return null

  return (
    <div className="bg-tiktok-gray rounded-2xl p-4 sm:p-6 border border-gray-800 relative group">
      <button 
        onClick={onRemove}
        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Thumbnail */}
        <div className="md:w-1/3 lg:w-1/4 mx-auto md:mx-0">
          <img
            src={videoData.cover}
            alt="Video thumbnail"
            className="w-full rounded-xl aspect-[9/16] object-cover"
          />
        </div>

        {/* Video Info */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2 pr-8">
            {videoData.title || 'TikTok Video'}
          </h2>
          
          <div className="flex gap-4 text-gray-400 mb-6">
            <span>❤️ {videoData.digg_count}</span>
            <span>💬 {videoData.comment_count}</span>
            <span>🔄 {videoData.share_count}</span>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src={videoData.author?.avatar}
              alt={videoData.author?.nickname}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-white font-medium">@{videoData.author?.unique_id}</p>
              <p className="text-gray-400 text-sm">{videoData.author?.nickname}</p>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-auto">
            {videoData.play && (
              <button
                onClick={handleDownload}
                disabled={downloadingFile}
                className="flex items-center justify-between w-full px-5 py-4 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white rounded-xl hover:opacity-90 transition-all font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span>{downloadingFile ? 'Downloading...' : 'Download Video'}</span>
                {downloadingFile ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview;