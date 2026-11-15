import { onlineManager, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Plugin } from 'vue'
import { BarteronApi } from '@/api/barteron'
import { i18n, setLocale } from '@/i18n'
import NetBanner from '@/components/system/NetBanner.vue'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork } from '@/sdk/mock-network'
import { OFFLINE_AFTER, useNetStore } from './net'

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => onlineManager.setOnline(true))

describe('«Нет связи с сетью»', () => {
  it('only a run of failed requests means the node is down; one answer clears it', () => {
    const net = useNetStore()
    expect(OFFLINE_AFTER).toBe(3)
    net.report(false)
    net.report(false)
    expect(net.offline).toBe(false)
    net.report(true)
    net.report(false)
    net.report(false)
    // Two in a row since the answer: not yet.
    expect(net.offline).toBe(false)
    net.report(false)
    expect(net.offline).toBe(true)
    net.report(true)
    expect(net.offline).toBe(false)
    expect(net.failures).toBe(0)
  })

  it('the device offline: the banner too — the query client holds reads instead of failing them', () => {
    const net = useNetStore()
    expect(net.offline).toBe(false)
    onlineManager.setOnline(false)
    expect(net.deviceOffline).toBe(true)
    expect(net.offline).toBe(true)
    expect(net.failures).toBe(0)
    onlineManager.setOnline(true)
    expect(net.offline).toBe(false)
  })

  it('the banner says which: the device offline or the node silent', async () => {
    await setLocale('ru')
    const global = {
      plugins: [i18n, [VueQueryPlugin, { queryClient: new QueryClient() }] as [Plugin, unknown]],
    }
    const device = mount(NetBanner, { props: { device: true }, global })
    expect(device.text()).toContain('Устройство не в сети')
    expect(device.text()).not.toContain('Нода не отвечает')
    const node = mount(NetBanner, { global })
    expect(node.text()).toContain('Нода не отвечает')
  })

  it('every node read tells whether the node answered', async () => {
    const sdk = createMockSdk({ network: createMockNetwork() })
    const seen: boolean[] = []
    const api = new BarteronApi(sdk, { onRpc: (answered) => seen.push(answered) })
    await api.chainHeight()
    sdk.mock.setOffline(true)
    await expect(api.chainHeight()).rejects.toThrow()
    expect(seen).toEqual([true, false])
  })

  it('«Повторить» asks again for what is on the page, and is busy meanwhile', async () => {
    await setLocale('ru')
    const client = new QueryClient()
    let release = () => {}
    const refetch = vi
      .spyOn(client, 'refetchQueries')
      .mockImplementation(() => new Promise<void>((r) => (release = r)))
    const w = mount(NetBanner, {
      global: { plugins: [i18n, [VueQueryPlugin, { queryClient: client }]] },
    })
    expect(w.text()).toContain('Нет связи с сетью')
    const button = w.get('[data-testid="net-retry"]')
    await button.trigger('click')
    expect(refetch).toHaveBeenCalledWith({ type: 'active' })
    expect(button.attributes('aria-busy')).toBe('true')
    release()
    await vi.waitFor(() => expect(button.attributes('aria-busy')).not.toBe('true'))
  })
})
