import { Download } from 'lucide-react'

function Header() {
  return (
    <header className="py-6 sm:py-8 text-center relative z-10">
      <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gray-900/80 border border-gray-800/80 mb-3 shadow-lg">
        <Download className="w-8 h-8 text-tiktok-cyan" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-tiktok-cyan via-white to-tiktok-pink bg-clip-text text-transparent">
          TikTok Downloader
        </h1>
      </div>
      <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">
        High fidelity without watermarks • Fast & Free
      </p>
    </header>
  )
}

export default Header
