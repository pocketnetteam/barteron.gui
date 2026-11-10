// Generated from the prototype: foundations.html (base set) and the s2–s8 screens (extra).
// `shield-fill` is not in the prototype: the moderator role mark (PLAN.md, stage 1 decisions).
// Line icons, 24 × 24, stroke 1.8, round caps and joins; filled icons set `fill`.

export type IconElement = ['path' | 'circle' | 'rect', Record<string, string>]

export interface IconDef {
  fill?: true
  els: IconElement[]
}

export const ICONS = {
  search: {
    els: [
      ['circle', { cx: '11', cy: '11', r: '7' }],
      ['path', { d: 'm20 20-3.5-3.5' }],
    ],
  },
  heart: {
    els: [['path', { d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }]],
  },
  exchange: { els: [['path', { d: 'M4 8h13l-3-3M20 16H7l3 3' }]] },
  pkoin: {
    els: [
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['path', { d: 'M10 17V7h3.2a3 3 0 0 1 0 6H10' }],
    ],
  },
  'safe-deal': {
    els: [
      ['path', { d: 'M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z' }],
      ['path', { d: 'm9 12 2 2 4-4' }],
    ],
  },
  node: {
    els: [
      ['rect', { x: '9', y: '3', width: '6', height: '6', rx: '1' }],
      ['rect', { x: '3', y: '15', width: '6', height: '6', rx: '1' }],
      ['rect', { x: '15', y: '15', width: '6', height: '6', rx: '1' }],
      ['path', { d: 'M12 9v3M6 15v-3h12v3' }],
    ],
  },
  wallet: {
    els: [
      ['rect', { x: '3', y: '6', width: '18', height: '14', rx: '2' }],
      ['path', { d: 'M3 10h18M16 15h2' }],
    ],
  },
  chat: { els: [['path', { d: 'M4 5h16v11H9l-5 4z' }]] },
  bell: {
    els: [
      ['path', { d: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z' }],
      ['path', { d: 'M10 21h4' }],
    ],
  },
  user: {
    els: [
      ['circle', { cx: '12', cy: '8', r: '4' }],
      ['path', { d: 'M4 21a8 8 0 0 1 16 0' }],
    ],
  },
  plus: { els: [['path', { d: 'M12 5v14M5 12h14' }]] },
  home: { els: [['path', { d: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z' }]] },
  location: {
    els: [
      ['path', { d: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z' }],
      ['circle', { cx: '12', cy: '9', r: '2.5' }],
    ],
  },
  delivery: {
    els: [
      ['path', { d: 'M3 6h11v10H3zM14 10h4l3 3v3h-7' }],
      ['circle', { cx: '7', cy: '18', r: '2' }],
      ['circle', { cx: '17', cy: '18', r: '2' }],
    ],
  },
  'pickup-point': {
    els: [
      ['path', { d: 'm12 3 8 4.5v9L12 21l-8-4.5v-9z' }],
      ['path', { d: 'm4 7.5 8 4.5 8-4.5M12 12v9' }],
    ],
  },
  filters: {
    els: [
      ['path', { d: 'M4 7h10M18 7h2M4 17h4M12 17h8' }],
      ['circle', { cx: '16', cy: '7', r: '2' }],
      ['circle', { cx: '10', cy: '17', r: '2' }],
    ],
  },
  tiles: {
    els: [
      ['rect', { x: '4', y: '4', width: '7', height: '7', rx: '1.5' }],
      ['rect', { x: '13', y: '4', width: '7', height: '7', rx: '1.5' }],
      ['rect', { x: '4', y: '13', width: '7', height: '7', rx: '1.5' }],
      ['rect', { x: '13', y: '13', width: '7', height: '7', rx: '1.5' }],
    ],
  },
  rows: { els: [['path', { d: 'M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1' }]] },
  photo: {
    els: [
      ['path', { d: 'M4 8h3l2-3h6l2 3h3v11H4z' }],
      ['circle', { cx: '12', cy: '13', r: '3.5' }],
    ],
  },
  video: {
    els: [
      ['rect', { x: '3', y: '6', width: '13', height: '12', rx: '2' }],
      ['path', { d: 'm16 10 5-3v10l-5-3' }],
    ],
  },
  star: {
    els: [
      ['path', { d: 'm12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z' }],
    ],
  },
  share: {
    els: [
      ['path', { d: 'M12 4v12M7 9l5-5 5 5' }],
      ['path', { d: 'M5 14v5h14v-5' }],
    ],
  },
  complain: { els: [['path', { d: 'M5 21V4h11l-2 4 2 4H5' }]] },
  external: { els: [['path', { d: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6' }]] },
  clock: {
    els: [
      ['circle', { cx: '12', cy: '12', r: '8' }],
      ['path', { d: 'M12 8v4l3 2' }],
    ],
  },
  retry: {
    els: [
      [
        'path',
        { d: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4' },
      ],
    ],
  },
  views: {
    els: [
      ['path', { d: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' }],
      ['circle', { cx: '12', cy: '12', r: '3' }],
    ],
  },
  edit: { els: [['path', { d: 'M4 20h4L19 9l-4-4L4 16z' }]] },
  delete: { els: [['path', { d: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' }]] },
  info: {
    els: [
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['path', { d: 'M12 11v5M12 8h.01' }],
    ],
  },
  warning: {
    els: [
      ['path', { d: 'M12 4 2.5 20h19z' }],
      ['path', { d: 'M12 10v4M12 17h.01' }],
    ],
  },
  check: { els: [['path', { d: 'm5 12 5 5 9-10' }]] },
  close: { els: [['path', { d: 'M6 6l12 12M18 6 6 18' }]] },
  chevron: { els: [['path', { d: 'm6 9 6 6 6-6' }]] },
  back: { els: [['path', { d: 'M19 12H5m6-6-6 6 6 6' }]] },
  more: {
    fill: true,
    els: [
      ['circle', { cx: '5', cy: '12', r: '1.6' }],
      ['circle', { cx: '12', cy: '12', r: '1.6' }],
      ['circle', { cx: '19', cy: '12', r: '1.6' }],
    ],
  },
  'chevron-right': { els: [['path', { d: 'm9 6 6 6-6 6' }]] },
  'chevron-left': { els: [['path', { d: 'm15 6-6 6 6 6' }]] },
  'arrow-right': { els: [['path', { d: 'M5 12h14m-5-5 5 5-5 5' }]] },
  'arrow-up': { els: [['path', { d: 'M12 19V5M5 12l7-7 7 7' }]] },
  'arrow-down': { els: [['path', { d: 'M12 5v14m-5-5 5 5 5-5' }]] },
  error: {
    els: [
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['path', { d: 'M12 8v5M12 16h.01' }],
    ],
  },
  image: {
    els: [
      ['rect', { x: '3', y: '5', width: '18', height: '14', rx: '2' }],
      ['circle', { cx: '9', cy: '10', r: '1.5' }],
      ['path', { d: 'm21 16-5-5-8 8' }],
    ],
  },
  shield: { els: [['path', { d: 'M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z' }]] },
  minus: { els: [['path', { d: 'M5 12h14' }]] },
  sort: { els: [['path', { d: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4' }]] },
  send: { els: [['path', { d: 'm3 11 18-8-8 18-2-8z' }]] },
  document: { els: [['path', { d: 'M7 3h7l5 5v13H7zM14 3v5h5' }]] },
  lock: {
    els: [
      ['rect', { x: '5', y: '11', width: '14', height: '10', rx: '2' }],
      ['path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }],
    ],
  },
  tip: {
    els: [
      [
        'path',
        {
          d: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
        },
      ],
    ],
  },
  telegram: {
    els: [
      ['path', { d: 'm21 4-18 7 6 2 2 6 3-4 5 4z' }],
      ['path', { d: 'm9 13 8-6' }],
    ],
  },
  'heart-filled': {
    fill: true,
    els: [['path', { d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }]],
  },
  'star-filled': {
    fill: true,
    els: [
      ['path', { d: 'm12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z' }],
    ],
  },
  play: { fill: true, els: [['path', { d: 'M7 5v14l12-7z' }]] },
  spinner: { els: [['path', { d: 'M12 3a9 9 0 1 1-9 9' }]] },
  'shield-fill': {
    fill: true,
    els: [['path', { d: 'M12 2 4 5.4v5.8c0 5 3.4 9.4 8 10.8 4.6-1.4 8-5.8 8-10.8V5.4z' }]],
  },
  'search-empty': {
    els: [
      ['circle', { cx: '11', cy: '11', r: '7' }],
      ['path', { d: 'm20 20-3.5-3.5M8.5 11h5' }],
    ],
  },
  'search-area': { els: [['path', { d: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4' }]] },
  'cat-transport': {
    els: [
      ['path', { d: 'M3 13l2-6h14l2 6v5H3z' }],
      ['circle', { cx: '7.5', cy: '15.5', r: '1.2' }],
      ['circle', { cx: '16.5', cy: '15.5', r: '1.2' }],
    ],
  },
  'cat-realty': {
    els: [
      ['rect', { x: '5', y: '3', width: '14', height: '18', rx: '1' }],
      ['path', { d: 'M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2' }],
    ],
  },
  'cat-electronics': {
    els: [
      ['rect', { x: '5', y: '5', width: '14', height: '10', rx: '1.5' }],
      ['path', { d: 'M3 19h18' }],
    ],
  },
  'cat-clothes': {
    els: [['path', { d: 'M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c-1 1.5-2.3 2-4 2s-3-.5-4-2z' }]],
  },
  'cat-kids': {
    els: [
      ['path', { d: 'M4 6h3l2 8h10l2-6H9' }],
      ['circle', { cx: '10', cy: '18', r: '1.6' }],
      ['circle', { cx: '17', cy: '18', r: '1.6' }],
    ],
  },
  'cat-services': {
    els: [
      ['rect', { x: '3', y: '7', width: '18', height: '13', rx: '2' }],
      ['path', { d: 'M9 7V5h6v2M3 12h18' }],
    ],
  },
  'cat-bikes': {
    els: [
      ['circle', { cx: '6', cy: '16', r: '3.5' }],
      ['circle', { cx: '18', cy: '16', r: '3.5' }],
      ['path', { d: 'M6 16 10 8h5l3 8M10 8 8 5H6M15 8l-3 8' }],
    ],
  },
  'cat-sport': {
    els: [
      ['circle', { cx: '12', cy: '12', r: '9' }],
      ['path', { d: 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18' }],
    ],
  },
  'cat-animals': {
    els: [
      ['circle', { cx: '8', cy: '8.5', r: '1.6' }],
      ['circle', { cx: '16', cy: '8.5', r: '1.6' }],
      ['circle', { cx: '4.8', cy: '12.5', r: '1.4' }],
      ['circle', { cx: '19.2', cy: '12.5', r: '1.4' }],
      ['path', { d: 'M12 12c-3 0-5 3-5 5s2 2 5 2 5 0 5-2-2-5-5-5z' }],
    ],
  },
  'cat-books': {
    els: [
      ['path', { d: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z' }],
      ['path', { d: 'M5 17a3 3 0 0 1 3-3h11' }],
    ],
  },
  'cat-collect': {
    els: [
      ['circle', { cx: '12', cy: '12', r: '8' }],
      ['circle', { cx: '12', cy: '12', r: '4.5' }],
    ],
  },
  'cat-food': {
    els: [['path', { d: 'M5 9h12v5a6 6 0 0 1-12 0zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3' }]],
  },
} satisfies Record<string, IconDef>

export type IconName = keyof typeof ICONS
