import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

/**
 * Generates a Base64 Data URL for a given URL or text
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width || 360,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#18181b', // zinc-900
      light: options?.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generates an SVG string for clean scalable rendering
 */
export async function generateQRCodeSvg(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  return await QRCode.toString(text, {
    type: 'svg',
    width: options?.width || 360,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#18181b',
      light: options?.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}
