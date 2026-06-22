let ffmpeg = null
let ffmpegLoaded = false
let loadingPromise = null
let fetchFileFn = null

export async function ensureFFmpeg() {
  if (ffmpegLoaded) return ffmpeg
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    // Dynamic import from CDN to avoid build-time bundling issues
    const ffmpegModule = await import(/* @vite-ignore */ 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js')
    const utilModule = await import(/* @vite-ignore */ 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js')

    const FFmpeg = ffmpegModule.FFmpeg
    const toBlobURL = utilModule.toBlobURL
    fetchFileFn = utilModule.fetchFile

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
    const id = Math.random().toString(36).substring(2, 9)
    const inputName = `input_${id}.mp4`
    const outputName = `output_${id}.mp4`
    
    await instance.writeFile(inputName, await fetchFileFn(blob))
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

/**
 * Resizes and pads a Blob image to fit inside target dimensions (contain fit)
 * with a black background, returning a new JPEG Blob.
 */
async function resizeImageToCanvas(blob, targetWidth = 720, targetHeight = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      
      // Paint background black
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, targetWidth, targetHeight)
      
      // Calculate contain fitting
      const imgRatio = img.width / img.height
      const targetRatio = targetWidth / targetHeight
      let drawWidth, drawHeight, x, y
      
      if (imgRatio > targetRatio) {
        drawWidth = targetWidth
        drawHeight = targetWidth / imgRatio
        x = 0
        y = (targetHeight - drawHeight) / 2
      } else {
        drawWidth = targetHeight * imgRatio
        drawHeight = targetHeight
        x = (targetWidth - drawWidth) / 2
        y = 0
      }
      
      ctx.drawImage(img, x, y, drawWidth, drawHeight)
      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          resolve(resizedBlob)
        } else {
          reject(new Error('Canvas blob generation failed'))
        }
      }, 'image/jpeg', 0.85)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/**
 * Combines an array of image URLs and a background audio URL into a single MP4 video file.
 * Automatically standardizes all images to 720x1280 to prevent FFmpeg encoding issues.
 * 
 * @param {string[]} imageUrls - Array of image URLs to include in the slideshow.
 * @param {string} audioUrl - URL of the background audio track.
 * @param {number} durationPerImage - Display duration (in seconds) for each image.
 * @returns {Promise<Blob>} The compiled MP4 video Blob.
 */
export async function renderSlideshowToVideo(imageUrls, audioUrl, durationPerImage = 3) {
  const instance = await ensureFFmpeg()
  const id = Math.random().toString(36).substring(2, 9)
  
  const imgDataArr = []
  let audioName = null
  let audioData = null
  const concatFileName = `concat_${id}.txt`
  const outputName = `output_${id}.mp4`

  try {
    // 1. Fetch and resize all images to 720x1280
    for (let idx = 0; idx < imageUrls.length; idx++) {
      const res = await fetch(imageUrls[idx])
      if (!res.ok) throw new Error(`Failed to fetch image ${idx + 1}`)
      const blob = await res.blob()
      
      // Standardize resolution/aspect ratio
      const resizedBlob = await resizeImageToCanvas(blob, 720, 1280)
      const fileData = await fetchFileFn(resizedBlob)
      
      imgDataArr.push({ name: `img_${id}_${idx}.jpg`, data: fileData })
    }

    // 2. Fetch audio if present
    if (audioUrl) {
      try {
        const res = await fetch(audioUrl)
        if (res.ok) {
          const blob = await res.blob()
          audioName = `audio_${id}.mp3`
          audioData = await fetchFileFn(blob)
        }
      } catch (err) {
        console.warn('Failed to fetch audio track, rendering video without sound:', err)
      }
    }

    // 3. Write files to virtual FS
    for (const img of imgDataArr) {
      await instance.writeFile(img.name, img.data)
    }
    
    if (audioName && audioData) {
      await instance.writeFile(audioName, audioData)
    }

    // 4. Create concat demuxer file content
    let concatContent = ''
    imgDataArr.forEach((img) => {
      concatContent += `file '${img.name}'\r\n`
      concatContent += `duration ${durationPerImage}\r\n`
    })
    if (imgDataArr.length > 0) {
      concatContent += `file '${imgDataArr[imgDataArr.length - 1].name}'\r\n`
    }

    const encoder = new TextEncoder()
    await instance.writeFile(concatFileName, encoder.encode(concatContent))

    // 5. Build FFmpeg command arguments
    const args = [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFileName
    ]

    if (audioName) {
      args.push('-i', audioName)
    }

    args.push(
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-r', '25',
      '-movflags', '+faststart'
    )

    if (audioName) {
      args.push('-c:a', 'aac', '-shortest')
    }

    args.push(outputName)

    // Execute FFmpeg
    await instance.exec(args)

    // Read the compiled MP4 file
    const outputData = await instance.readFile(outputName)
    return new Blob([outputData.buffer], { type: 'video/mp4' })

  } finally {
    // Cleanup virtual files to free up memory
    try {
      await instance.deleteFile(concatFileName)
      for (const img of imgDataArr) {
        await instance.deleteFile(img.name)
      }
      if (audioName) {
        await instance.deleteFile(audioName)
      }
      await instance.deleteFile(outputName)
    } catch (cleanupErr) {
      console.warn('FFmpeg cleanup warning:', cleanupErr)
    }
  }
}

