import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function VideoPreview({ videoData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-tiktok-gray rounded-2xl p-4 sm:p-6 border border-gray-800">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Thumbnail */}
        <div className="md:w-1/2 mx-auto md:mx-0 max-w-xs">
          <img
            src={videoData.cover}
            alt="Video thumbnail"
            className="w-full rounded-xl aspect-[9/16] object-cover"
          />
        </div>

        {/* Video Info */}
        <div className="md:w-1/2 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2">
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

          {/* Download Options */}
          <div className="mt-auto space-y-3">
            {/* HD Quality */}
            {videoData.play && (
              <a
                href={videoData.play}
                download
                className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <span className="font-medium">HD Quality</span>
                <Download className="w-5 h-5" />
              </a>
            )}

            {/* Normal Quality */}
            {videoData.wm && (
              <a
                href={videoData.wm}
                download
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                <span className="font-medium">Normal Quality</span>
                <Download className="w-5 h-5" />
              </a>
            )}

            {/* No Watermark */}
            {videoData.play && (
              <button
                onClick={() => handleCopy(videoData.play)}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium">Copy HD Link</span>
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview
