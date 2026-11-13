import { afterEach, describe, expect, it, vi } from 'vitest'
import { dataUrlBytes, fitSize, isPhotoFile, PHOTO_MAX_SIDE, shrinkPhoto } from './image'

describe('photo size', () => {
  it('fits into 1080×1080 keeping the proportions', () => {
    expect(PHOTO_MAX_SIDE).toBe(1080)
    expect(fitSize(4000, 3000)).toEqual({ width: 1080, height: 810 })
    expect(fitSize(3000, 4000)).toEqual({ width: 810, height: 1080 })
    expect(fitSize(1080, 1080)).toEqual({ width: 1080, height: 1080 })
  })

  it('a small photo is never enlarged; an empty one has no size', () => {
    expect(fitSize(640, 480)).toEqual({ width: 640, height: 480 })
    expect(fitSize(0, 480)).toEqual({ width: 0, height: 0 })
    expect(fitSize(640, -1)).toEqual({ width: 0, height: 0 })
  })

  it('bytes a data URL carries, padding included', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,AAAA')).toBe(3)
    expect(dataUrlBytes('data:image/jpeg;base64,AAA=')).toBe(2)
    expect(dataUrlBytes('data:image/jpeg;base64,AA==')).toBe(1)
    expect(dataUrlBytes('no comma')).toBe(0)
  })

  it('JPEG, PNG, WebP and HEIC from phones; nothing else', () => {
    expect(isPhotoFile({ type: 'image/jpeg' })).toBe(true)
    expect(isPhotoFile({ type: 'IMAGE/PNG' })).toBe(true)
    expect(isPhotoFile({ type: 'image/heic' })).toBe(true)
    expect(isPhotoFile({ type: 'image/gif' })).toBe(false)
    expect(isPhotoFile({ type: 'application/pdf' })).toBe(false)
    expect(isPhotoFile({ type: '' })).toBe(false)
  })
})

describe('shrinking', () => {
  /** happy-dom decodes no pictures: a stand-in image and canvas record what was drawn. */
  function stub(natural: { width: number; height: number } | 'broken', context = true) {
    const drawn: unknown[][] = []
    const canvas = {
      width: 300,
      height: 150,
      getContext: () => {
        if (!context) return null
        const ctx = {
          fillStyle: '',
          fillRect: (...args: unknown[]) => drawn.push(['fillRect', ctx.fillStyle, ...args]),
          drawImage: (_img: unknown, ...args: unknown[]) => drawn.push(['drawImage', ...args]),
        }
        return ctx
      },
      toDataURL: (type: string, quality: number) => `data:${type};q=${quality},AAAA`,
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : createElement(tag)
    )
    const loaded: string[] = []
    class FakeImage {
      naturalWidth = natural === 'broken' ? 0 : natural.width
      naturalHeight = natural === 'broken' ? 0 : natural.height
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(value: string) {
        loaded.push(value)
        queueMicrotask(() => (natural === 'broken' ? this.onerror?.() : this.onload?.()))
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const created: Blob[] = []
    const revoked: string[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      created.push(blob as Blob)
      return `blob:photo-${created.length}`
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => void revoked.push(url))
    return { canvas, drawn, loaded, created, revoked }
  }

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('a camera photo becomes a JPEG within 1080, white under transparency', async () => {
    const s = stub({ width: 4000, height: 3000 })
    expect(await shrinkPhoto('data:image/png;base64,BBBB')).toBe('data:image/jpeg;q=0.85,AAAA')
    expect(s.loaded).toEqual(['data:image/png;base64,BBBB'])
    expect(s.drawn).toEqual([
      ['fillRect', '#ffffff', 0, 0, 1080, 810],
      ['drawImage', 0, 0, 1080, 810],
    ])
    expect(s.created).toEqual([])
  })

  it('a file is read through an object URL, released afterwards, as is the canvas', async () => {
    const s = stub({ width: 800, height: 600 })
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    await shrinkPhoto(file, 1080, 0.5)
    expect(s.created).toEqual([file])
    expect(s.loaded).toEqual(['blob:photo-1'])
    expect(s.revoked).toEqual(['blob:photo-1'])
    expect(s.drawn[1]).toEqual(['drawImage', 0, 0, 800, 600])
    expect([s.canvas.width, s.canvas.height]).toEqual([0, 0])
  })

  it('a picture the browser cannot read fails, and the object URL is still released', async () => {
    const s = stub('broken')
    await expect(shrinkPhoto(new File(['x'], 'a.heic'))).rejects.toThrow('image:unreadable')
    expect(s.revoked).toEqual(['blob:photo-1'])
  })

  it('no size or no canvas: unreadable', async () => {
    stub({ width: 0, height: 10 })
    await expect(shrinkPhoto('data:image/png;base64,BBBB')).rejects.toThrow('image:unreadable')
    vi.restoreAllMocks()
    stub({ width: 10, height: 10 }, false)
    await expect(shrinkPhoto('data:image/png;base64,BBBB')).rejects.toThrow('image:unreadable')
  })
})
