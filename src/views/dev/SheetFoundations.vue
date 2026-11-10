<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import { contrastRatio, parseColor } from '@/lib/contrast'
import { ICONS, type IconName } from '@/ui/icons'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import ShowSection from './ShowSection.vue'

/** Raw palette from foundations.html: the semantic tokens are built from it. */
const PALETTE = [
  {
    name: 'Violet',
    note: 'бренд и действия · 500 — кнопки в тёмной теме, 600 — в светлой',
    steps: [
      ['50', '#F3F0FF'],
      ['100', '#E6E0FF'],
      ['200', '#CEC2FF'],
      ['300', '#AE9BFF'],
      ['400', '#8E73FF'],
      ['500', '#6E4FFF'],
      ['600', '#5B3CF0'],
      ['700', '#4A2CCF'],
      ['800', '#3B23A3'],
      ['900', '#2A1A73'],
    ],
  },
  {
    name: 'Neutral',
    note: 'фон, текст, линии · холодный оттенок',
    steps: [
      ['0', '#FFFFFF'],
      ['25', '#FAFAFB'],
      ['50', '#F4F4F6'],
      ['100', '#EBEBEF'],
      ['200', '#DCDCE2'],
      ['300', '#C3C3CC'],
      ['400', '#9A9AA6'],
      ['500', '#68687A'],
      ['600', '#5A5A66'],
      ['700', '#42424C'],
      ['800', '#2A2A33'],
      ['950', '#101016'],
    ],
  },
  {
    name: 'Amber',
    note: 'PKOIN и продвижение · не для кнопок',
    steps: [
      ['50', '#FFF8E6'],
      ['100', '#FFEDBF'],
      ['300', '#FFD166'],
      ['500', '#F5A524'],
      ['700', '#9A5B00'],
      ['900', '#5C3600'],
    ],
  },
] as const

const STATUSES = [
  ['Успех', 'Опубликовано, сделка завершена, бот подключён', '--success', '--success-soft'],
  ['Внимание', 'Ожидает подтверждения в блокчейне, истекает срок', '--warning', '--warning-soft'],
  ['Ошибка', 'Ошибка ноды, транзакция отклонена, удаление', '--danger', '--danger-soft'],
  ['Инфо', 'Подсказки, гео-фильтр включён, советы', '--info', '--info-soft'],
] as const

const TOKENS = [
  ['bg/page', 'Фон страницы', '--page'],
  ['bg/surface', 'Карточки, панели, шапка', '--surface'],
  ['bg/subtle', 'Вложенные блоки, шапки таблиц', '--subtle'],
  ['bg/muted', 'Поля ввода, нейтральные кнопки', '--muted'],
  ['border/default', 'Разделители', '--border'],
  ['border/strong', 'Рамка поля при наведении', '--border-strong'],
  ['text/primary', 'Основной текст, цены', '--text'],
  ['text/secondary', 'Описания, вторичный текст', '--text2'],
  ['text/tertiary', 'Мета, подписи', '--text3'],
  ['action/primary', 'Главная кнопка', '--primary'],
  ['action/primary-hover', 'Наведение', '--primary-hover'],
  ['action/primary-soft', 'Вторичная кнопка, теги обмена', '--primary-soft'],
  ['text/link', 'Ссылки, текст на soft', '--link'],
  ['pkoin/fg', 'Знак PKOIN, продвижение', '--pkoin'],
  ['pkoin/soft', 'Подложка PKOIN', '--pkoin-soft'],
  ['success/fg', 'Успех', '--success'],
  ['success/soft', 'Подложка успеха', '--success-soft'],
  ['warning/fg', 'Ожидание, внимание', '--warning'],
  ['warning/soft', 'Подложка внимания', '--warning-soft'],
  ['danger/fg', 'Ошибки, удаление', '--danger'],
  ['danger/soft', 'Подложка ошибки', '--danger-soft'],
  ['info/fg', 'Подсказки', '--info'],
  ['info/soft', 'Подложка подсказки', '--info-soft'],
  ['overlay', 'Затемнение под модалкой', '--overlay'],
] as const

const CONTRAST = [
  ['text/primary на surface', '--text', '--surface'],
  ['text/secondary на surface', '--text2', '--surface'],
  ['text/tertiary на bg/page', '--text3', '--page'],
  ['text/tertiary на surface', '--text3', '--surface'],
  ['Белый на action/primary', '#ffffff', '--primary'],
  ['text/link на primary-soft', '--link', '--primary-soft'],
  ['pkoin/fg на pkoin/soft', '--pkoin', '--pkoin-soft'],
  ['danger/fg на danger/soft', '--danger', '--danger-soft'],
] as const

const TYPE = [
  [
    'display',
    '40/48 · 800',
    't-display',
    'Меняйте ненужное на нужное',
    'Промо, «О проекте», пустые экраны',
  ],
  ['h1', '32/40 · 700', 't-h1', 'Электроника', 'Заголовок страницы, название объявления'],
  ['h2', '24/32 · 700', 't-h2', 'Новые объявления', 'Секции страницы'],
  ['h3', '20/28 · 600', 't-h3', 'Варианты получения товара', 'Блоки, заголовки диалогов'],
  ['price-l', '28/36 · 800', 't-price-l', '1 250 PKOIN', 'Цена на странице объявления'],
  ['price-m', '18/24 · 700', 't-price-m', '1 250 PKOIN', 'Цена в карточке'],
  [
    'title',
    '16/22 · 500',
    't-title',
    'Смартфон, 128 ГБ, синий, отличное состояние',
    'Заголовок карточки (ссылка)',
  ],
  [
    'body-l',
    '16/24 · 400',
    't-body-l',
    'Продаю или меняю. Пользовался аккуратно, полный комплект, есть чек.',
    'Описание объявления, длинный текст',
  ],
  [
    'body',
    '14/20 · 400',
    't-body',
    'Укажите категорию, чтобы покупателям было проще найти объявление',
    'Интерфейсный текст, подсказки',
  ],
  ['label', '13/18 · 600', 't-label', 'Цена, PKOIN', 'Подписи полей, бейджи, табы'],
  [
    'caption',
    '12/16 · 400',
    't-caption',
    'Москва, Таганская · 2 часа назад',
    'Мета: место, дата, просмотры',
  ],
  [
    'mono',
    '13/18 · 500',
    't-mono',
    'PQx7…9fKe · tx 3a9f…c41e',
    'Адреса, хеши объявлений и транзакций',
  ],
] as const

const SPACES = [
  [1, 2],
  [2, 4],
  [3, 8],
  [4, 12],
  [5, 16],
  [6, 20],
  [7, 24],
  [8, 32],
  [9, 40],
  [10, 48],
  [11, 64],
] as const

const RADII = [
  ['xs · 6', '--radius-xs', 'Бейджи, теги'],
  ['s · 8', '--radius-s', 'Кнопки S, чекбоксы'],
  ['m · 12', '--radius-m', 'Кнопки, поля, фото'],
  ['l · 16', '--radius-l', 'Карточки-блоки, панели'],
  ['xl · 24', '--radius-xl', 'Модалки, листы'],
  ['full · ∞', '--radius-full', 'Чипы, аватары'],
] as const

const ELEVATION = [
  ['0 · плоско', 'карточки на фоне', 'inset 0 0 0 1px var(--border)'],
  ['1 · наведение', 'карточка при hover', 'var(--shadow-1)'],
  ['2 · всплывающее', 'меню, подсказки', 'var(--shadow-2)'],
  ['3 · модальное', 'диалоги, листы', 'var(--shadow-3)'],
] as const

const BREAKPOINTS = [
  { px: 390, label: 'телефон' },
  { px: 768, label: 'планшет' },
  { px: 1024, label: 'малый десктоп' },
  { px: 1280, label: 'десктоп' },
  { px: 1440, label: 'макеты' },
]

const iconNames = Object.keys(ICONS) as IconName[]

/* Token values are read from the CSS, so the sheet shows what the app really uses. */
const lightProbe = ref<HTMLElement>()
const darkProbe = ref<HTMLElement>()
const values = ref<{ light: Record<string, string>; dark: Record<string, string> }>({
  light: {},
  dark: {},
})

function read(el: HTMLElement | undefined): Record<string, string> {
  if (!el) return {}
  const style = getComputedStyle(el)
  const names = new Set<string>([
    ...TOKENS.map((t) => t[2]),
    ...CONTRAST.flatMap((c) => [c[1], c[2]]),
    ...STATUSES.flatMap((s) => [s[2], s[3]]),
  ])
  return Object.fromEntries(
    [...names].filter((n) => n.startsWith('--')).map((n) => [n, style.getPropertyValue(n).trim()])
  )
}

function resolve(theme: 'light' | 'dark', token: string): string {
  return token.startsWith('--') ? (values.value[theme][token] ?? '') : token
}

function ratio(theme: 'light' | 'dark', fg: string, bg: string): number | null {
  const a = parseColor(resolve(theme, fg))
  const b = parseColor(resolve(theme, bg))
  return a && b ? contrastRatio(a, b) : null
}

const contrastRows = computed(() =>
  CONTRAST.map(([label, fg, bg]) => ({
    label,
    fg,
    bg,
    light: ratio('light', fg, bg),
    dark: ratio('dark', fg, bg),
  }))
)

/** Hex in upper case, as on the sheet; rgba() stays as is. */
function hexOf(theme: 'light' | 'dark', token: string): string {
  const v = values.value[theme][token] ?? ''
  return v.startsWith('#') ? v.toUpperCase() : v
}

function fmt(r: number | null): string {
  return r === null ? '—' : `${r.toFixed(1).replace('.', ',')}:1`
}

const viewport = ref(typeof window === 'undefined' ? 0 : window.innerWidth)
function onResize(): void {
  viewport.value = window.innerWidth
}
const currentBreakpoint = computed(() => {
  const w = viewport.value
  if (w >= 1280) return 'Десктоп'
  if (w >= 768) return 'Планшет'
  return 'Телефон'
})

onMounted(() => {
  values.value = { light: read(lightProbe.value), dark: read(darkProbe.value) }
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="sheet">
    <span ref="lightProbe" data-theme="light" hidden />
    <span ref="darkProbe" data-theme="dark" hidden />

    <p class="sheet__lead">
      Фиолетовый — действия и ссылки. Янтарный — только PKOIN и продвижение. Холодная нейтральная
      шкала — всё остальное. Шрифт Onest: кириллица и латиница для ru / en / sr, цифры одинаковой
      ширины для цен.
    </p>

    <ShowSection title="Палитра">
      <div class="palettes">
        <div
          v-for="scale in PALETTE"
          :key="scale.name"
          class="palette"
          :class="'palette--' + scale.name.toLowerCase()"
        >
          <div class="palette__head">
            <span class="palette__name">{{ scale.name }}</span>
            <span class="palette__note">{{ scale.note }}</span>
          </div>
          <div class="palette__row" :style="{ '--n': scale.steps.length }">
            <div v-for="[step, hex] in scale.steps" :key="step" class="swatch">
              <span class="swatch__color" :style="{ background: hex }" />
              <span class="swatch__step">{{ step }}</span>
              <code class="swatch__hex">{{ hex }}</code>
            </div>
          </div>
        </div>
      </div>
      <div class="palette">
        <div class="palette__head">
          <span class="palette__name">Статусы</span>
          <span class="palette__note">текст и подложка</span>
        </div>
        <div class="statuses">
          <div
            v-for="[name, text, fg, bg] in STATUSES"
            :key="name"
            class="status"
            :style="{ background: `var(${bg})`, color: `var(${fg})` }"
          >
            <span class="status__name"><span class="status__dot" />{{ name }}</span>
            <span class="status__text">{{ text }}</span>
            <code class="status__hex">{{ hexOf('light', fg) }} · {{ hexOf('light', bg) }}</code>
          </div>
        </div>
      </div>
    </ShowSection>

    <ShowSection
      title="Семантические токены"
      note="В макетах и коде используются только они. Тема меняет значения, имена остаются."
    >
      <div class="tokens" role="table" aria-label="Семантические токены">
        <div class="tokens__row tokens__row--head" role="row">
          <span role="columnheader">Токен и роль</span>
          <span role="columnheader">Светлая</span>
          <span role="columnheader">Тёмная</span>
        </div>
        <div v-for="[name, role, cssVar] in TOKENS" :key="name" class="tokens__row" role="row">
          <span role="cell" class="tokens__name">
            <code>{{ name }}</code>
            <span>{{ role }}</span>
          </span>
          <span v-for="th in ['light', 'dark'] as const" :key="th" role="cell" class="tokens__val">
            <span :data-theme="th" class="tokens__chip" :style="{ background: `var(${cssVar})` }" />
            <code>{{ hexOf(th, cssVar) }}</code>
          </span>
        </div>
      </div>
    </ShowSection>

    <div class="sheet__pair">
      <ShowSection title="Тема в действии">
        <div class="themes">
          <div
            v-for="th in ['light', 'dark'] as const"
            :key="th"
            :data-theme="th"
            class="themes__box"
          >
            <span class="themes__label">{{ th === 'light' ? 'Светлая' : 'Тёмная' }}</span>
            <div class="themes__card">
              <div class="themes__photo"><UiIcon name="image" :size="28" :stroke="1.4" /></div>
              <span class="themes__title">Велосипед городской</span>
              <PriceTag :price="{ pkoin: 420 }" :size="18" />
              <span class="themes__meta">Меняю на самокат</span>
              <UiButton :size="40" block>Предложить обмен</UiButton>
            </div>
          </div>
        </div>
        <span class="sheet__note">
          В тёмной теме тени не работают — уровни отделяются светлотой поверхности и линией
          border/default.
        </span>
      </ShowSection>

      <ShowSection title="Контраст (WCAG AA)" note="Считается по токенам выше, AA — от 4,5:1">
        <div class="contrast" role="table" aria-label="Контраст">
          <div class="contrast__row contrast__row--head" role="row">
            <span role="columnheader">Пара</span>
            <span role="columnheader">Светлая</span>
            <span role="columnheader">Тёмная</span>
          </div>
          <div v-for="row in contrastRows" :key="row.label" class="contrast__row" role="row">
            <span role="cell">{{ row.label }}</span>
            <span
              v-for="th in ['light', 'dark'] as const"
              :key="th"
              role="cell"
              class="contrast__cell"
            >
              <span
                class="contrast__sample"
                :data-theme="th"
                :style="{
                  color: row.fg.startsWith('--') ? `var(${row.fg})` : row.fg,
                  background: `var(${row.bg})`,
                }"
                >Аа</span
              >
              <span
                class="contrast__ratio"
                :class="{ 'contrast__ratio--fail': (row[th] ?? 0) < 4.5 }"
                :data-testid="`contrast-${th}`"
              >
                {{ fmt(row[th]) }}
              </span>
            </span>
          </div>
        </div>
      </ShowSection>
    </div>

    <ShowSection
      title="Типографика · Onest"
      note="Хеши и транзакции — JetBrains Mono · цены — tabular-nums"
    >
      <div class="type">
        <div v-for="[name, spec, cls, sample, where] in TYPE" :key="name" class="type__row">
          <span class="type__name">
            <code>{{ name }}</code>
            <span>{{ spec }}</span>
          </span>
          <span class="type__sample" :class="[cls, { 'type__sample--link': name === 'title' }]">{{
            sample
          }}</span>
          <span class="type__where">{{ where }}</span>
        </div>
      </div>
    </ShowSection>

    <div class="sheet__triple">
      <ShowSection title="Отступы · шаг 4">
        <div class="spaces">
          <div v-for="[n, px] in SPACES" :key="n" class="spaces__row">
            <code>space-{{ n }}</code>
            <span class="spaces__bar" :style="{ width: `calc(var(--space-${n}) * 3)` }" />
            <span class="spaces__px">{{ px }} px</span>
          </div>
        </div>
      </ShowSection>
      <ShowSection title="Скругления">
        <div class="radii">
          <div v-for="[name, cssVar, where] in RADII" :key="name" class="radii__item">
            <span class="radii__box" :style="{ borderRadius: `var(${cssVar})` }" />
            <span class="radii__name">{{ name }}</span>
            <span class="radii__where">{{ where }}</span>
          </div>
        </div>
      </ShowSection>
      <ShowSection title="Высота">
        <div class="elevation">
          <div v-for="[name, where, shadow] in ELEVATION" :key="name" class="elevation__item">
            <span class="elevation__box" :style="{ boxShadow: shadow }" />
            <span class="elevation__name">{{ name }}</span>
            <span class="elevation__where">{{ where }}</span>
          </div>
        </div>
      </ShowSection>
    </div>

    <ShowSection title="Сетка и брейкпоинты" note="Контейнер 1248 px сохраняем из текущей вёрстки">
      <div class="grids">
        <div class="grids__item">
          <b>Десктоп ≥ 1280</b> · 12 колонок · gutter 24 · контейнер 1248
          <span
            >Выдача: фильтры 3 колонки + 4 карточки в ряд. Главная: 5 карточек. Объявление: контент
            8 + липкая колонка 4.</span
          >
          <div class="grids__cols" style="--cols: 12; --gap: 6px">
            <span v-for="i in 12" :key="i" />
          </div>
        </div>
        <div class="grids__item">
          <b>Планшет 768–1279</b> · 8 колонок · gutter 16 · поля 24
          <span>Фильтры уходят в лист, 3 карточки в ряд.</span>
          <div class="grids__cols" style="--cols: 8; --gap: 6px">
            <span v-for="i in 8" :key="i" />
          </div>
        </div>
        <div class="grids__item">
          <b>Телефон &lt; 768</b> · 4 колонки · gutter 8 · поля 16
          <span>2 карточки в ряд, таб-бар снизу.</span>
          <div class="grids__cols" style="--cols: 4; --gap: 6px">
            <span v-for="i in 4" :key="i" />
          </div>
        </div>
      </div>
      <div class="ruler">
        <span v-for="bp in BREAKPOINTS" :key="bp.px" class="ruler__mark">
          <b>{{ bp.px }}</b> · {{ bp.label }}
        </span>
      </div>
      <span class="sheet__note" data-testid="breakpoint">
        Сейчас: {{ currentBreakpoint }}, ширина окна {{ viewport }} px
      </span>
    </ShowSection>

    <ShowSection
      title="Иконки"
      note="Линейные, 24 × 24, обводка 1.8, скруглённые концы. Размеры 16 / 20 / 24. Заменяют Font Awesome."
    >
      <div class="icons">
        <div v-for="name in iconNames" :key="name" class="icons__item">
          <UiIcon :name="name" />
          <span>{{ name }}</span>
        </div>
      </div>
    </ShowSection>
  </div>
</template>

<style scoped>
.sheet {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sheet__lead {
  max-width: 900px;
  font-size: 17px;
  line-height: 26px;
  color: var(--text2);
}

.sheet__note {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.sheet__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.sheet__triple {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

code {
  font-family: var(--font-mono);
  font-size: 12px;
}

/* Palette */
.palettes {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px 32px;
}

.palette--violet {
  grid-column: 1 / -1;
}

.palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.palette__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
}

.palette__name {
  font-size: 15px;
  font-weight: 700;
}

.palette__note {
  font-size: 13px;
  color: var(--text3);
}

.palette__row {
  display: grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: 8px;
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.swatch__color {
  height: 56px;
  border-radius: var(--radius-m);
  box-shadow: inset 0 0 0 1px rgba(16, 16, 22, 0.08);
}

.swatch__step {
  font-size: 13px;
  font-weight: 600;
}

.swatch__hex {
  color: var(--text3);
  font-size: 11px;
}

.statuses {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.status {
  padding: 14px 16px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status__name {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status__dot {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.status__text {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.status__hex {
  font-size: 11px;
  opacity: 0.85;
}

/* Tokens */
.tokens__row {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid var(--border);
}

.tokens__row--head {
  border-top: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
}

.tokens__name {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  align-items: baseline;
  font-size: 13px;
  color: var(--text2);
}

.tokens__name code {
  font-size: 13px;
  color: var(--text);
}

.tokens__val {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tokens__val code {
  color: var(--text2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tokens__chip {
  flex: none;
  width: 40px;
  height: 28px;
  border-radius: var(--radius-s);
  box-shadow: inset 0 0 0 1px rgba(128, 128, 140, 0.35);
}

/* Theme in action */
.themes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.themes__box {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--page);
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.themes__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
}

.themes__card {
  padding: 12px;
  border-radius: var(--radius-l);
  background: var(--surface);
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.themes__photo {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-m);
  background: var(--photo);
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.themes__title {
  font-size: 15px;
  color: var(--link);
}

.themes__meta {
  font-size: 13px;
  color: var(--text2);
  margin-bottom: 4px;
}

/* Contrast */
.contrast__row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 6px 0;
  border-top: 1px solid var(--border);
  font-size: 13px;
}

.contrast__row--head {
  border-top: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
}

.contrast__cell {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
}

.contrast__sample {
  width: 40px;
  height: 32px;
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(128, 128, 140, 0.25);
}

.contrast__ratio {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--success);
}

.contrast__ratio--fail {
  color: var(--danger);
}

/* Typography */
.type__row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) 260px;
  gap: 24px;
  align-items: baseline;
  padding: 12px 0;
  border-top: 1px solid var(--border);
}

.type__row:first-child {
  border-top: 0;
}

.type__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text3);
}

.type__name code {
  font-size: 13px;
  color: var(--text);
}

.type__sample {
  min-width: 0;
  overflow-wrap: anywhere;
}

.type__sample--link {
  color: var(--link);
}

.type__where {
  font-size: 13px;
  color: var(--text2);
}

/* Spacing, radii, elevation */
.spaces {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spaces__row {
  display: grid;
  grid-template-columns: 72px 1fr 48px;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.spaces__bar {
  height: 12px;
  border-radius: 3px;
  background: var(--primary);
}

.spaces__px {
  color: var(--text3);
  text-align: right;
}

.radii,
.elevation {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.radii__item,
.elevation__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radii__box {
  height: 64px;
  background: var(--primary-soft);
  box-shadow: inset 0 0 0 2px var(--primary);
}

.elevation {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--muted);
}

.elevation__box {
  height: 64px;
  border-radius: var(--radius-l);
  background: var(--surface);
}

.radii__name,
.elevation__name {
  font-size: 13px;
  font-weight: 600;
}

.radii__where,
.elevation__where {
  font-size: 12px;
  color: var(--text3);
}

/* Grid */
.grids {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.grids__item {
  padding: 16px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--text2);
}

.grids__item b {
  color: var(--text);
}

.grids__cols {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: var(--gap);
  margin-top: 4px;
}

.grids__cols span {
  height: 40px;
  border-radius: 4px;
  background: var(--primary-soft);
}

.ruler {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 13px;
  color: var(--text2);
}

.ruler b {
  color: var(--text);
}

/* Icons */
.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px;
}

.icons__item {
  padding: 14px 4px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icons__item span {
  font-size: 11px;
  color: var(--text2);
}

@media (max-width: 1279px) {
  .sheet__triple {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .palette__row {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .palettes {
    grid-template-columns: 1fr;
  }

  .statuses {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1023px) {
  .sheet__pair,
  .sheet__triple,
  .grids {
    grid-template-columns: 1fr;
  }

  .type__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

@media (max-width: 767px) {
  .sheet__lead {
    font-size: 15px;
    line-height: 22px;
  }

  .palette__row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .statuses,
  .themes {
    grid-template-columns: 1fr;
  }

  .tokens__row {
    grid-template-columns: 1fr 1fr;
  }

  .tokens__name {
    grid-column: 1 / -1;
  }

  .tokens__row--head span:first-child {
    display: none;
  }
}
</style>
