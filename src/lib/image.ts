/**
 * Photos before they go to Bastyon for upload. The previous host shrank every
 * picture to fit 1080×1080 itself (pocketnet.gui `js/lib/apps/index.js`,
 * `images.upload`); bastyon-nextgen sends what it gets. Shrinking here makes
 * both hosts store the same size and keeps the postMessage small.
 */

/** Longest side after shrinking, px: what the previous host used. */
export const PHOTO_MAX_SIDE = 1080
/** JPEG quality of the shrunk photo. */
export const PHOTO_QUALITY = 0.85
/** Types a seller may add (the mockup: «JPEG или PNG»; WebP and HEIC from phones become JPEG). */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/** Size that fits into `max`×`max`, keeping the proportions; never larger than the original. */
export function fitSize(width: number, height: number, max = PHOTO_MAX_SIDE) {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Bytes a data URL carries. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  const body = dataUrl.slice(comma + 1)
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding)
}

export const isPhotoFile = (file: { type: string }): boolean =>
  PHOTO_TYPES.includes(file.type.toLowerCase())

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image:unreadable'))
    img.src = src
  })
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('image:unreadable'))
    reader.readAsDataURL(blob)
  })
}

/**
 * A file or a data URL → JPEG data URL within 1080×1080. The browser applies
 * the EXIF orientation when it decodes, so phone photos stand upright.
 */
export async function shrinkPhoto(
  source: Blob | string,
  max = PHOTO_MAX_SIDE,
  quality = PHOTO_QUALITY
): Promise<string> {
  const src = typeof source === 'string' ? source : await readAsDataUrl(source)
  const img = await loadImage(src)
  const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, max)
  if (!width || !height) throw new Error('image:unreadable')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('image:unreadable')
  // PNG with transparency: white under it, JPEG has no alpha.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}
