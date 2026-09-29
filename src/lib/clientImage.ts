/**
 * Client-side helper to compress and optimize receipt screenshots.
 * Resizes large smartphone photos (which can be 5-15MB) to max 1600x1600,
 * converts them to JPEG at 0.82 quality, reducing file size to ~100-250KB.
 * Returns both a Blob (for uploading) and a base64 Data URL (for preview & fallback).
 */
export async function optimizeReceiptImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  return new Promise((resolve) => {
    // Generate safe filename with .jpg extension
    const rawName = file.name || 'receipt.jpg'
    const baseName = rawName.replace(/\.[^/.]+$/, '') || 'receipt'
    const safeFilename = `${baseName}.jpg`

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ blob: file, dataUrl: '', filename: safeFilename })
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      // Fallback: resolve with raw file
      let rawDataUrl = ''
      try {
        rawDataUrl = URL.createObjectURL(file)
      } catch {
        // no-op
      }
      resolve({ blob: file, dataUrl: rawDataUrl, filename: safeFilename })
    }

    reader.onload = (e) => {
      const src = e.target?.result as string
      if (!src) {
        let rawDataUrl = ''
        try {
          rawDataUrl = URL.createObjectURL(file)
        } catch {
          // no-op
        }
        resolve({ blob: file, dataUrl: rawDataUrl, filename: safeFilename })
        return
      }

      const img = new Image()
      img.onerror = () => {
        // If image decoding fails, resolve with raw data URL
        resolve({ blob: file, dataUrl: src, filename: safeFilename })
      }

      img.onload = () => {
        try {
          let { width, height } = img

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width)
              width = maxDimension
            } else {
              width = Math.round((width * maxDimension) / height)
              height = maxDimension
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = Math.max(width, 1)
          canvas.height = Math.max(height, 1)
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            resolve({ blob: file, dataUrl: src, filename: safeFilename })
            return
          }

          // Fill white background in case of transparent PNGs
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          const dataUrl = canvas.toDataURL('image/jpeg', quality)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl, filename: safeFilename })
              } else {
                resolve({ blob: file, dataUrl, filename: safeFilename })
              }
            },
            'image/jpeg',
            quality
          )
        } catch {
          resolve({ blob: file, dataUrl: src, filename: safeFilename })
        }
      }

      img.src = src
    }

    reader.readAsDataURL(file)
  })
}
