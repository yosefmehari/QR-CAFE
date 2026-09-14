import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files (PNG, JPG, WEBP) are allowed' }, { status: 400 })
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds maximum limit of 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine extension
    let ext = path.extname(file.name).toLowerCase()
    if (!ext || ext.length < 2) {
      ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg'
    }

    const filename = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filePath = path.join(uploadsDir, filename)
    await fs.promises.writeFile(filePath, buffer)

    const publicUrl = `/uploads/${filename}`
    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err: unknown) {
    console.error('Error uploading payment screenshot:', err)
    const msg = err instanceof Error ? err.message : 'Failed to upload image'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
