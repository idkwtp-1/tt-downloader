import { Download } from 'lucide-react'

function Header() {
  return (
    <header className="py-8 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Download className="w-10 h-10 text-tiktok-cyan" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-tiktok-cyan to-tiktok-pink bg-clip-text text-transparent">
          TikTok Downloader
        </h1>
      </div>
      <p className="text-gray-400 text-lg">
        Download TikTok videos in HD or normal quality
      </p>
    </header>
  )
}

export default Header
