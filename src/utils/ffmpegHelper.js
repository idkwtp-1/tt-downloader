import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

let ffmpeg = null
let ffmpegLoaded = false
let loadingPromise = null

export async function ensureFFmpeg() {
  if (ffmpegLoaded) return ffmpeg
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    ffmpeg = new FFmpeg()
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

    // Create a Blob URL wrapping the CDN worker script to bypass CORS security constraints and local 404 errors.
    const workerURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js'
    const blobCode = `import "${workerURL}";`
    const blob = new Blob([blobCode], { type: 'text/javascript' })
    const classWorkerURL = URL.createObjectURL(blob)

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      classWorkerURL
    })
    ffmpegLoaded = true
    return ffmpeg
  })()

  return loadingPromise
}

/**
 * Remuxes an MP4 video blob to relocate the moov atom to the beginning,
 * enabling seamless streaming and compatibility on iOS devices.
 * Falls back to the original blob if FFmpeg fails.
 * 
 * @param {Blob} blob - The input MP4 video blob.
 * @returns {Promise<Blob>} The processed blob (or original blob as fallback).
 */
export async function applyFastStart(blob) {
  try {
    const instance = await ensureFFmpeg()
    const inputName = 'input.mp4'
    const outputName = 'output.mp4'
    
    await instance.writeFile(inputName, await fetchFile(blob))
    await instance.exec(['-i', inputName, '-c', 'copy', '-movflags', '+faststart', outputName])
    const fixedData = await instance.readFile(outputName)
    
    // Cleanup virtual files to free up WASM memory
    await instance.deleteFile(inputName)
    await instance.deleteFile(outputName)
    
    return new Blob([fixedData.buffer], { type: 'video/mp4' })
  } catch (err) {
    console.error('FFmpeg processing failed, falling back to original blob:', err)
    return blob
  }
}
