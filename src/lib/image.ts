/**
 * Photos before they go to Bastyon for upload. Both hosts shrink every picture
 * to fit 1080×1080 themselves (pocketnet.gui `js/lib/apps/index.js` and
 * bastyon-nextgen `media-upload.ts`, `images.upload`). Shrinking here as well
 * keeps the postMessage small, shows the size the seller will get and drops
 * the EXIF data (the place a phone photo was taken) before it leaves the app.
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

/**
 * A file or a data URL → JPEG data URL within 1080×1080. The browser applies
 * the EXIF orientation when it decodes, so phone photos stand upright.
 *
 * A file is read through an object URL, not a data URL: a 10 MB photo would
 * otherwise sit in memory a second time as a 13 MB string.
 */
export async function shrinkPhoto(
  source: Blob | string,
  max = PHOTO_MAX_SIDE,
  quality = PHOTO_QUALITY
): Promise<string> {
  const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source)
  const canvas = document.createElement('canvas')
  try {
    const img = await loadImage(objectUrl ?? (source as string))
    const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, max)
    if (!width || !height) throw new Error('image:unreadable')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('image:unreadable')
    // PNG with transparency: white under it, JPEG has no alpha.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    // Safari counts canvas memory until the canvas is gone; an empty one frees it now.
    canvas.width = 0
    canvas.height = 0
  }
}
