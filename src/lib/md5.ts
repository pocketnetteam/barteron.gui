/**
 * MD5 of a text, lowercase hex, exactly as the old `sdk.MD5`: the safe deal
 * id carries its first 8 hex. Like the old one, it takes the low byte of each
 * UTF-16 unit — not UTF-8. For the ASCII a deal link holds (hex, addresses,
 * digits) that is the standard MD5. A link with other letters, made by hand,
 * opens in both apps or in neither.
 *
 * Not for security: the deal id only checks that its link was not edited by
 * hand.
 */

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const K = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0
)

export function md5(text: string): string {
  const input = Uint8Array.from({ length: text.length }, (_, i) => text.charCodeAt(i) & 0xff)
  // Padding: 0x80, zeros up to 56 mod 64, then the bit length, little-endian.
  const length = (((input.length + 8) >>> 6) + 1) << 6
  const bytes = new Uint8Array(length)
  bytes.set(input)
  bytes[input.length] = 0x80
  const bits = input.length * 8
  const view = new DataView(bytes.buffer)
  view.setUint32(length - 8, bits >>> 0, true)
  view.setUint32(length - 4, Math.floor(bits / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  const m = new Uint32Array(16)
  for (let offset = 0; offset < length; offset += 64) {
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(offset + i * 4, true)
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      const sum = (a + f + K[i]! + m[g]!) >>> 0
      a = d
      d = c
      c = b
      b = (b + ((sum << S[i]!) | (sum >>> (32 - S[i]!)))) >>> 0
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const out = new DataView(new ArrayBuffer(16))
  ;[a0, b0, c0, d0].forEach((word, i) => out.setUint32(i * 4, word, true))
  return Array.from(new Uint8Array(out.buffer), (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}
