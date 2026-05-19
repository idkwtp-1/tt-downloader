import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'

function InputSection({ onFetchVideo }) {
  const [inputs, setInputs] = useState([''])

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
  }

  const addInput = () => {
    setInputs([...inputs, ''])
  }

  const removeInput = (index) => {
    const newInputs = inputs.filter((_, i) => i !== index)
    setInputs(newInputs.length ? newInputs : [''])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Filter out empty URLs
    const urlsToFetch = inputs.map(url => url.trim()).filter(Boolean)
    
    if (urlsToFetch.length > 0) {
      urlsToFetch.forEach(url => onFetchVideo(url))
      setInputs(['']) // Reset to a single empty input
    }
  }

  const hasMultipleInputs = inputs.length > 1
  const isFormValid = inputs.some(url => url.trim().length > 0)

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {inputs.map((url, index) => (
          <div key={index} className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder={`Paste TikTok video URL ${hasMultipleInputs ? index + 1 : ''} here...`}
                className="w-full px-5 py-4 bg-tiktok-gray border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan focus:ring-1 focus:ring-tiktok-cyan transition-all"
              />
            </div>
            {hasMultipleInputs && (
              <button
                type="button"
                onClick={() => removeInput(index)}
                className="p-4 bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-700 rounded-xl transition-all"
                title="Remove link"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={addInput}
            className="px-6 py-4 bg-gray-800 text-white border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Link
          </button>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className="px-8 py-4 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white font-semibold rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            {hasMultipleInputs ? 'Download All' : 'Download'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InputSection
