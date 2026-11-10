import { describe, expect, it } from 'vitest'
import { applyHostInsets, hostCorner } from './host-insets'

describe('hostCorner', () => {
  it('keeps the petal width plus a gap free at the top right', () => {
    expect(hostCorner({ closebutton: { side: 'right', top: 16, width: 34, height: 28 } })).toBe(
      '42px'
    )
    expect(hostCorner({ closebutton: { width: 34 } })).toBe('42px')
  })

  it('moves nothing when the host does not say where its button is', () => {
    expect(hostCorner(null)).toBe('0px')
    expect(hostCorner({ margintop: '0px' })).toBe('0px')
    expect(hostCorner({ closebutton: { side: 'left', width: 34 } })).toBe('0px')
    expect(hostCorner({ closebutton: { side: 'right' } })).toBe('0px')
  })

  it('writes the variable on the root element', () => {
    const root = document.createElement('div')
    applyHostInsets({ closebutton: { width: 30 } }, root)
    expect(root.style.getPropertyValue('--host-corner')).toBe('38px')
  })
})
