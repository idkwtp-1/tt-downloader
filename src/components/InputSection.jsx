import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

function InputSection({ onFetchVideo, loading, error }) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url.trim()) {
      onFetchVideo(url.trim())
    }
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste TikTok video URL here..."
            className="w-full px-5 py-4 bg-tiktok-gray border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan transition-all"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-8 py-4 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Download
            </>
          )}
        </button>
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

export default InputSection
