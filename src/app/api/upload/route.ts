import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let buffer: Buffer
    let mimeType = 'image/jpeg'
    let originalName = 'receipt.jpg'

    if (contentType.includes('application/json')) {
      const body = await request.json()
      const dataUrl = body.image || body.dataUrl || body.file

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
      }

      if (dataUrl.startsWith('data:')) {
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          mimeType = matches[1]
          buffer = Buffer.from(matches[2], 'base64')
        } else {
          buffer = Buffer.from(dataUrl.replace(/^data:[^,]+,/, ''), 'base64')
        }
      } else {
        buffer = Buffer.from(dataUrl, 'base64')
      }

      if (body.filename) originalName = String(body.filename)
    } else {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      originalName = file.name || 'receipt.jpg'
      mimeType = file.type || 'image/jpeg'

      // Allow image MIME types or known image extensions
      const ext = path.extname(originalName).toLowerCase()
      const isImageMime = mimeType.startsWith('image/')
      const isImageExt = ['.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif', '.bmp', '.gif', '.svg'].includes(ext)

      if (!isImageMime && !isImageExt && mimeType !== 'application/octet-stream') {
        return NextResponse.json(
          { error: 'Only image files (PNG, JPG, JPEG, WEBP) are allowed' },
          { status: 400 }
        )
      }

      // Limit to 20MB
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size exceeds maximum limit of 20MB' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
    }

    // Determine extension
    let ext = path.extname(originalName).toLowerCase()
    if (!ext || ext.length < 2) {
      ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg'
    }

    const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const filePath = path.join(uploadsDir, filename)
      await fs.promises.writeFile(filePath, buffer)

      const publicUrl = `/uploads/${filename}`
      return NextResponse.json({ success: true, url: publicUrl })
    } catch (fsErr) {
      // In serverless / read-only environments (e.g. Vercel lambdas), fallback to base64 data URL
      console.warn('Filesystem write not available, using data URL fallback:', fsErr)
      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
      return NextResponse.json({ success: true, url: dataUrl })
    }
  } catch (err: unknown) {
    console.error('Error uploading payment screenshot:', err)
    const msg = err instanceof Error ? err.message : 'Failed to process screenshot'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
