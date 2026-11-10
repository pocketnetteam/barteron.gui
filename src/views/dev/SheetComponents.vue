<script setup lang="ts">
import { computed, ref } from 'vue'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton, { type ButtonVariant } from '@/ui/UiButton.vue'
import UiCheckbox from '@/ui/UiCheckbox.vue'
import UiChip from '@/ui/UiChip.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiField from '@/ui/UiField.vue'
import type { IconName } from '@/ui/icons'
import UiInput from '@/ui/UiInput.vue'
import UiProgress from '@/ui/UiProgress.vue'
import UiRadio from '@/ui/UiRadio.vue'
import UiRating from '@/ui/UiRating.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSelect from '@/ui/UiSelect.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiSteps from '@/ui/UiSteps.vue'
import UiSwitch from '@/ui/UiSwitch.vue'
import UiTabs from '@/ui/UiTabs.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import UiToast from '@/ui/UiToast.vue'
import UiTooltip from '@/ui/UiTooltip.vue'
import { showToast, updateToast } from '@/ui/toast'
import SearchBar from '@/components/layout/SearchBar.vue'
import ShowSection from './ShowSection.vue'

interface ButtonRow {
  variant: ButtonVariant
  name: string
  role: string
  l: [string, IconName?]
  m: string
  s: string
  icon: [IconName, string]
  disabled?: string
  extra?: 'loading' | 'note' | 'focus'
}

const BUTTONS: ButtonRow[] = [
  {
    variant: 'primary',
    name: 'Primary',
    role: 'Главное действие',
    l: ['Предложить обмен', 'exchange'],
    m: 'Применить',
    s: 'Применить',
    icon: ['plus', 'Добавить'],
    disabled: 'Опубликовать',
    extra: 'loading',
  },
  {
    variant: 'contrast',
    name: 'Contrast',
    role: 'Второе ключевое: «Купить»',
    l: ['Купить за 1 250 PKOIN'],
    m: 'Купить',
    s: 'Купить',
    icon: ['wallet', 'Кошелёк'],
    disabled: 'Купить',
    extra: 'note',
  },
  {
    variant: 'secondary',
    name: 'Secondary',
    role: 'Сопутствующее',
    l: ['Безопасная сделка', 'safe-deal'],
    m: 'Найти обмены',
    s: 'Найти обмены',
    icon: ['share', 'Поделиться'],
    disabled: 'Найти обмены',
  },
  {
    variant: 'neutral',
    name: 'Neutral',
    role: 'Нейтральные, фильтры',
    l: ['Написать продавцу', 'chat'],
    m: 'Сбросить',
    s: 'Сбросить',
    icon: ['heart', 'В избранное'],
    disabled: 'Сбросить',
  },
  {
    variant: 'outline',
    name: 'Outline',
    role: 'На фото и цветных фонах',
    l: ['Предпросмотр'],
    m: 'Показать ещё',
    s: 'Показать ещё',
    icon: ['more', 'Ещё'],
    extra: 'focus',
  },
  {
    variant: 'ghost',
    name: 'Ghost / Link',
    role: 'Третичные действия',
    l: ['Профиль в Bastyon'],
    m: 'Все категории',
    s: 'Все категории',
    icon: ['close', 'Закрыть'],
  },
  {
    variant: 'danger',
    name: 'Danger',
    role: 'Необратимое',
    l: ['Удалить объявление', 'delete'],
    m: 'Снять с публикации',
    s: 'Снять',
    icon: ['delete', 'Удалить'],
    disabled: 'Удалить',
  },
  {
    variant: 'pkoin',
    name: 'PKOIN',
    role: 'Продвижение',
    l: ['Продвинуть', 'pkoin'],
    m: 'Продвинуть',
    s: 'Продвинуть',
    icon: ['pkoin', 'Продвинуть'],
  },
]

const title = ref('')
const titleFocus = ref('Велосипед городской Stels')
const price = ref('0')
const priceFrom = ref('10')
const priceTo = ref('')
const query = ref('')
const sort = ref('new')
const SORTS = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'old', label: 'Сначала старые' },
  { value: 'cheap', label: 'Сначала дешёвые' },
  { value: 'expensive', label: 'Сначала дорогие' },
]
const description = ref(
  'Рама алюминиевая, 7 скоростей. Пользовался аккуратно, хранился в квартире.'
)

const pickup = ref(false)
const post = ref(true)
const condition = ref('new')
const autorenew = ref(true)
const priceFromSwitch = ref(false)

const tab = ref('active')
const TABS = [
  { value: 'active', label: 'Активные', count: 12 },
  { value: 'inactive', label: 'Неактивные', count: 3 },
  { value: 'drafts', label: 'Черновики', count: 1 },
]
const view = ref('tiles')
const VIEWS = [
  { value: 'tiles', label: 'Плитка', icon: 'tiles' as const },
  { value: 'rows', label: 'Список', icon: 'rows' as const },
  { value: 'map', label: 'Карта', icon: 'location' as const },
]
const crumbs = [
  { label: 'Главная', to: { name: 'home' } },
  { label: 'Транспорт', to: { name: 'category', params: { id: '1' } } },
  { label: 'Велосипеды' },
]
const chipFree = ref(false)
const chipExchange = ref(true)
const chipSafe = ref(false)
const activeFilters = ref(['10–500 PKOIN', 'До 10 км'])

const modal = ref(false)
const sheet = ref(false)
const how = ref('safe')

const descriptionCount = computed(() => description.value.length)

function publishDemo(): void {
  const id = showToast('Публикуем в сети…', { kind: 'progress' })
  setTimeout(() => updateToast(id, 'Объявление в сети', { kind: 'success' }), 1800)
}

function errorDemo(): void {
  showToast('Не отправлено', {
    kind: 'error',
    action: { label: 'Повторить', run: publishDemo },
  })
}
</script>

<template>
  <div class="sheet">
    <p class="sheet__lead">
      Минимальная зона нажатия — 44 px; на десктопе допустимы кнопки S 32 px внутри плотных списков.
      Фокус — кольцо 3 px.
    </p>

    <ShowSection title="Кнопки">
      <div class="buttons" role="table" aria-label="Кнопки">
        <div class="buttons__row buttons__row--head" role="row">
          <span>Вариант</span><span>L · 48</span><span>M · 40</span><span>S · 32</span>
          <span>Иконка</span><span>Недоступна</span><span>Загрузка</span>
        </div>
        <div v-for="row in BUTTONS" :key="row.variant" class="buttons__row" role="row">
          <span class="buttons__name">
            <b>{{ row.name }}</b>
            <span>{{ row.role }}</span>
          </span>
          <span>
            <UiButton
              :variant="row.variant"
              :size="48"
              :icon="row.l[1]"
              :external="row.variant === 'ghost'"
            >
              {{ row.l[0] }}
            </UiButton>
          </span>
          <span
            ><UiButton :variant="row.variant" :size="40">{{ row.m }}</UiButton></span
          >
          <span
            ><UiButton :variant="row.variant" :size="32">{{ row.s }}</UiButton></span
          >
          <span>
            <UiButton :variant="row.variant" :size="40" :icon="row.icon[0]" :label="row.icon[1]" />
          </span>
          <span>
            <UiButton v-if="row.disabled" :variant="row.variant" :size="40" disabled>
              {{ row.disabled }}
            </UiButton>
          </span>
          <span>
            <UiButton v-if="row.extra === 'loading'" :size="40" loading>Отправка…</UiButton>
            <span v-else-if="row.extra === 'note'" class="sheet__note">
              Не ставим две Primary рядом: обмен — Primary, покупка — Contrast
            </span>
            <span v-else-if="row.extra === 'focus'" class="sheet__note">
              Фокус с клавиатуры — Tab
            </span>
          </span>
        </div>
      </div>
    </ShowSection>

    <div class="sheet__pair">
      <ShowSection title="Поля ввода">
        <div class="grid2">
          <UiField label="Название" hint="По умолчанию">
            <UiInput v-model="title" placeholder="Например, велосипед городской" />
          </UiField>
          <UiField label="Название" :count="titleFocus.length" :max="80" hint="С счётчиком">
            <UiInput v-model="titleFocus" maxlength="80" />
          </UiField>
          <UiField label="Цена" error="Укажите цену или выберите «Бесплатно»">
            <UiInput v-model="price" inputmode="decimal" suffix="PKOIN" />
          </UiField>
          <UiField label="Адрес ПВЗ" hint="Недоступно" disabled>
            <UiInput model-value="Определяется по точке на карте" />
          </UiField>
        </div>
        <UiField label="Поиск" group>
          <SearchBar v-model="query" scope="Во всех категориях" :size="48" />
        </UiField>
        <div class="grid2">
          <UiField label="Цена, PKOIN" group>
            <div class="grid2 grid2--tight">
              <UiInput v-model="priceFrom" :size="44" prefix="от" aria-label="Цена от" />
              <UiInput
                v-model="priceTo"
                :size="44"
                prefix="до"
                placeholder="∞"
                aria-label="Цена до"
              />
            </div>
          </UiField>
          <UiField label="Сортировка">
            <UiSelect v-model="sort" :options="SORTS" />
          </UiField>
        </div>
        <UiField
          label="Описание"
          hint="Не повторяйте название — опишите состояние и комплект"
          :count="descriptionCount"
          :max="3000"
        >
          <UiTextarea v-model="description" maxlength="3000" />
        </UiField>
      </ShowSection>

      <ShowSection title="Выбор и навигация">
        <div class="grid3">
          <div class="stack">
            <span class="sheet__caption">Чекбокс</span>
            <UiCheckbox v-model="pickup">Самовывоз</UiCheckbox>
            <UiCheckbox v-model="post">Почтой, курьером</UiCheckbox>
            <UiCheckbox disabled>Пункт выдачи</UiCheckbox>
          </div>
          <div class="stack" role="radiogroup" aria-label="Состояние">
            <span class="sheet__caption">Радио</span>
            <UiRadio v-model="condition" value="new" name="cond">Новое</UiRadio>
            <UiRadio v-model="condition" value="used" name="cond">Б/У</UiRadio>
            <UiRadio v-model="condition" value="any" name="cond">Не важно</UiRadio>
          </div>
          <div class="stack">
            <span class="sheet__caption">Переключатель</span>
            <UiSwitch v-model="autorenew">Автопродление</UiSwitch>
            <UiSwitch v-model="priceFromSwitch">Цена «от»</UiSwitch>
            <UiSwitch disabled>Фикс. в ₽</UiSwitch>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Табы со счётчиком</span>
          <UiTabs v-model="tab" :items="TABS" label="Мои объявления" />
        </div>
        <div class="grid2">
          <div class="stack">
            <span class="sheet__caption">Сегменты</span>
            <UiSegmented v-model="view" :items="VIEWS" label="Вид выдачи" />
          </div>
          <div class="stack">
            <span class="sheet__caption">Хлебные крошки</span>
            <UiBreadcrumbs :items="crumbs" />
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Чипы: фильтр, выбранный, активный фильтр с удалением</span>
          <div class="row">
            <UiChip :selected="chipFree" @click="chipFree = !chipFree">Бесплатно</UiChip>
            <UiChip :selected="chipExchange" @click="chipExchange = !chipExchange"
              >С обменом</UiChip
            >
            <UiChip :selected="chipSafe" icon="shield" @click="chipSafe = !chipSafe">
              Безопасная сделка
            </UiChip>
            <UiChip
              v-for="f in activeFilters"
              :key="f"
              removable
              :remove-label="`Убрать фильтр «${f}»`"
              @remove="activeFilters = activeFilters.filter((x) => x !== f)"
            >
              {{ f }}
            </UiChip>
          </div>
        </div>
      </ShowSection>
    </div>

    <div class="sheet__pair sheet__pair--75">
      <ShowSection title="Обратная связь">
        <div class="grid2">
          <UiAlert tone="info" title="Включён фильтр по геопозиции">
            Показываем объявления в радиусе 10 км. <a href="#">Изменить на карте</a>
          </UiAlert>
          <UiAlert tone="success" title="Объявление опубликовано">
            Поделитесь им в Bastyon, чтобы его увидело больше людей
          </UiAlert>
          <UiAlert tone="warning" title="Курс валюты не загрузился">
            Цены показаны только в PKOIN. <a href="#">Повторить</a>
          </UiAlert>
          <UiAlert tone="danger" title="Нода вернула ошибку">
            Слишком много транзакций. Попробуйте через минуту.
          </UiAlert>
        </div>
        <div class="grid3">
          <UiToast kind="progress" text="Публикуем в сети…" />
          <UiToast kind="success" text="Ссылка скопирована" />
          <UiToast
            kind="error"
            text="Не отправлено"
            :action="{ label: 'Повторить', run: publishDemo }"
          />
        </div>
        <div class="row">
          <UiButton variant="neutral" :size="36" @click="publishDemo"
            >Показать тост публикации</UiButton
          >
          <UiButton variant="neutral" :size="36" @click="errorDemo">Показать тост ошибки</UiButton>
        </div>
        <div class="grid3 grid3--center">
          <div class="stack">
            <span class="sheet__caption">Прогресс загрузки</span>
            <UiProgress :value="0.64" caption="Фото 4 из 6 · 2,1 МБ" label="Загрузка фото" />
          </div>
          <div class="stack">
            <span class="sheet__caption">Подсказка</span>
            <UiTooltip v-slot="{ describedby }" text="Комиссию гаранта оплачивает продавец">
              <UiButton variant="neutral" :size="32" :aria-describedby="describedby">
                Комиссия?
              </UiButton>
            </UiTooltip>
          </div>
          <div class="stack">
            <span class="sheet__caption">Скелетон</span>
            <div class="skeleton-row">
              <UiSkeleton width="56px" height="56px" radius="12px" />
              <div class="stack stack--tight">
                <UiSkeleton width="90%" />
                <UiSkeleton width="55%" />
              </div>
            </div>
          </div>
        </div>
      </ShowSection>

      <ShowSection title="Метки и пользователи">
        <div class="stack">
          <span class="sheet__caption">Бейджи</span>
          <div class="row row--tight">
            <UiBadge>Б/У</UiBadge>
            <UiBadge tone="primary">Новое</UiBadge>
            <UiBadge tone="success">Бесплатно</UiBadge>
            <UiBadge tone="pkoin">Продвигается</UiBadge>
            <UiBadge tone="info">ПВЗ</UiBadge>
            <UiBadge tone="warning">Истекает через 2 дня</UiBadge>
            <UiBadge tone="danger">Снято</UiBadge>
            <UiBadge tone="photo" icon="play">Видео</UiBadge>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Аватары · 64 / 48 / 32 / 24, без фото — инициалы</span>
          <div class="row row--center">
            <UiAvatar name="Анна Ковалёва" seed="a" :size="64" />
            <UiAvatar name="Илья Петров" seed="b" :size="48" />
            <UiAvatar name="Мария" seed="c" :size="32" />
            <UiAvatar name="Дмитрий" seed="d" :size="24" />
            <UiAvatar name="Олег Смирнов" seed="a" :size="48" role="guarantor" />
            <UiAvatar name="Вера Орлова" seed="d" :size="48" role="moderator" />
            <span class="sheet__note">Значок роли:<br />гарант, модератор</span>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Рейтинг</span>
          <div class="row row--center">
            <UiRating :value="4.8" :count="23" :to="{ name: 'home' }" />
            <span class="photo-demo"><UiRating :value="4.6" variant="photo" /></span>
            <span class="sheet__note">← на фото карточки</span>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Шаги мастера</span>
          <UiSteps :steps="['Категория', 'Фото', 'Обмен и цена', 'Проверка']" :current="1" />
        </div>
      </ShowSection>
    </div>

    <ShowSection title="Окна" note="На телефоне модальное окно становится нижним листом">
      <div class="row">
        <UiButton variant="danger" @click="modal = true">Снять с публикации…</UiButton>
        <UiButton variant="neutral" @click="sheet = true">Как купить? (лист)</UiButton>
      </div>
    </ShowSection>

    <UiDialog v-model:open="modal" title="Снять с публикации?">
      <p>
        Объявление исчезнет из поиска после подтверждения в сети. Вернуть его можно в разделе
        «Неактивные».
      </p>
      <template #actions>
        <UiButton variant="neutral" @click="modal = false">Отмена</UiButton>
        <UiButton variant="danger" @click="modal = false">Снять</UiButton>
      </template>
    </UiDialog>

    <UiDialog v-model:open="sheet" title="Как купить?" presentation="sheet">
      <div class="stack" role="radiogroup" aria-label="Как купить">
        <UiChoiceCard
          v-model="how"
          value="safe"
          name="how"
          icon="safe-deal"
          title="Безопасная сделка"
          description="Деньги у гаранта до получения товара"
        />
        <UiChoiceCard
          v-model="how"
          value="direct"
          name="how"
          icon="chat"
          title="Напрямую"
          description="Договоритесь с продавцом в чате"
        />
      </div>
      <template #actions>
        <UiButton :size="48" block @click="sheet = false">Выбрать гаранта</UiButton>
      </template>
    </UiDialog>
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

.sheet__caption {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--text3);
}

.sheet__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.sheet__pair--75 {
  grid-template-columns: 7fr 5fr;
}

.buttons__row {
  display: grid;
  grid-template-columns: 160px 280px 200px 150px 56px 170px minmax(0, 1fr);
  gap: 16px 24px;
  align-items: center;
  padding: 8px 0;
}

.buttons__row--head {
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
}

.buttons__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text3);
}

.buttons__name b {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.grid2--tight {
  gap: 8px;
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 20px;
}

.grid3--center {
  align-items: center;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.stack--tight {
  flex: 1;
  justify-content: center;
  gap: 8px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row--tight {
  gap: 8px;
}

.row--center {
  align-items: center;
  gap: 14px;
}

.skeleton-row {
  display: flex;
  gap: 10px;
}

.photo-demo {
  padding: 10px;
  border-radius: var(--radius-m);
  background: var(--photo);
}

@media (max-width: 1279px) {
  .sheet__pair,
  .sheet__pair--75 {
    grid-template-columns: 1fr;
  }

  /* Narrower screens: one row of buttons per variant, wrapping. */
  .buttons__row--head {
    display: none;
  }

  .buttons__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--border);
  }

  .buttons__name {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .sheet__lead {
    font-size: 15px;
    line-height: 22px;
  }

  .grid2,
  .grid3 {
    grid-template-columns: 1fr;
  }
}
</style>
