import { afterEach, describe, expect, it } from 'vitest'
import { mountUi } from '@/test/mount'
import type { GallerySlide, VideoSlide } from './gallery'
import ItemGallery from './ItemGallery.vue'

const video = (status: VideoSlide['status']): VideoSlide => ({
  kind: 'video',
  playlist: status === 'ready' ? 'https://mock.video/master.m3u8' : null,
  poster: null,
  duration: status === 'ready' ? '0:42' : null,
  status,
})
const photo = (name: string): GallerySlide => ({ kind: 'image', src: `https://img/${name}.jpg` })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the offer gallery', () => {
  it('the video becoming known does not send the buyer back to the first photo', async () => {
    const w = mountUi(ItemGallery, {
      props: { slides: [video('loading'), photo('a'), photo('b')], title: 'Планшет' },
    })
    await w.get('.gal__arrow--next').trigger('click')
    await w.get('.gal__arrow--next').trigger('click')
    expect(w.get('.gal__counter').text()).toBe('3 / 3')
    // The host answered about the video a second later.
    await w.setProps({ slides: [video('ready'), photo('a'), photo('b')] })
    expect(w.get('.gal__counter').text()).toBe('3 / 3')
    w.unmount()
  })

  it('another offer starts from its first photo, the phone strip too', async () => {
    const w = mountUi(ItemGallery, {
      props: { slides: [photo('a'), photo('b'), photo('c')], title: 'Планшет' },
    })
    await w.get('.gal__arrow--prev').trigger('click')
    expect(w.get('.gal__counter').text()).toBe('3 / 3')
    const strip = w.get<HTMLElement>('.gal__strip').element
    strip.scrollLeft = 640
    await w.setProps({ slides: [photo('d'), photo('e')], title: 'Велосипед' })
    expect(w.get('.gal__counter').text()).toBe('1 / 2')
    expect(strip.scrollLeft).toBe(0)
    w.unmount()
  })

  it('a photo that does not load is a placeholder, and stays one when the video comes', async () => {
    const w = mountUi(ItemGallery, {
      props: { slides: [photo('a'), photo('b'), video('loading')], title: 'Планшет' },
    })
    await w.get('.gal__stage img').trigger('error')
    expect(w.find('.gal__stage img').exists()).toBe(false)
    expect(w.find('.gal__stage .gal__placeholder').exists()).toBe(true)
    await w.setProps({ slides: [photo('a'), photo('b'), video('ready')] })
    expect(w.find('.gal__stage img').exists()).toBe(false)
    // The next photo still shows.
    await w.get('.gal__arrow--next').trigger('click')
    expect(w.get('.gal__stage img').attributes('src')).toBe('https://img/b.jpg')
    w.unmount()
  })

  it('no photos: a placeholder and nothing to open; one photo: no arrows or counter', async () => {
    const none = mountUi(ItemGallery, { props: { slides: [], title: 'Планшет' } })
    expect(none.get('.gal__stage').attributes('disabled')).toBeDefined()
    expect(none.find('.gal__counter').exists()).toBe(false)
    await none.get('.gal__stage').trigger('click')
    expect(none.emitted('open')).toBeUndefined()
    none.unmount()

    const one = mountUi(ItemGallery, { props: { slides: [photo('a')], title: 'Планшет' } })
    expect(one.find('.gal__arrow--next').exists()).toBe(false)
    expect(one.find('.gal__counter').exists()).toBe(false)
    expect(one.find('.gal__thumbs').exists()).toBe(false)
    await one.get('.gal__stage').trigger('click')
    expect(one.emitted('open')).toEqual([[0]])
    one.unmount()
  })
})
