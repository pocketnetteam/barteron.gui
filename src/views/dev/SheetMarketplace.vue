<script setup lang="ts">
import { ref } from 'vue'
import BastyonLink from '@/components/BastyonLink.vue'
import ExchangeChain from '@/components/exchange/ExchangeChain.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import MobileTopBar from '@/components/layout/MobileTopBar.vue'
import TabBar from '@/components/layout/TabBar.vue'
import NetStatusBadge, { type NetStatus } from '@/components/net/NetStatusBadge.vue'
import TxPanel, { type TxStep } from '@/components/net/TxPanel.vue'
import ExchangeList from '@/components/offer/ExchangeList.vue'
import OfferCard from '@/components/offer/OfferCard.vue'
import OfferMini from '@/components/offer/OfferMini.vue'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import OfferRow from '@/components/offer/OfferRow.vue'
import OwnOfferCard from '@/components/offer/OwnOfferCard.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import SellerCard from '@/components/user/SellerCard.vue'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiCheckbox from '@/ui/UiCheckbox.vue'
import UiChip from '@/ui/UiChip.vue'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'
import UiTracker from '@/ui/UiTracker.vue'
import { showToast } from '@/ui/toast'
import { DEMO_CARDS, DEMO_ITEM, DEMO_MINI, DEMO_ROW } from './demo'
import ShowSection from './ShowSection.vue'

const cards = ref(DEMO_CARDS.map((c) => ({ ...c, offer: { ...c.offer } })))
const row = ref({ ...DEMO_ROW })

const STATUSES: { status: NetStatus; eta?: string; label?: string }[] = [
  { status: 'sending' },
  { status: 'waiting', eta: '~1 мин' },
  { status: 'done' },
  { status: 'removing' },
  { status: 'deleting' },
  { status: 'failed' },
  { status: 'draft' },
]

const TX_STEPS: TxStep[] = [
  { label: 'Фото загружены', detail: '6 из 6', state: 'done' },
  { label: 'Подписано и отправлено на ноду', detail: 'tx 3a9f…c41e', mono: true, state: 'done' },
  { label: 'Ждём включения в блок', detail: 'Обычно до минуты, иногда несколько', state: 'active' },
  { label: 'Объявление в сети', detail: 'Появится в поиске у всех', state: 'pending' },
]

const DEAL_STEPS = [
  { title: 'Сделка создана', text: 'Гарант подтвердил участие в чате' },
  { title: 'Оплата у гаранта', text: 'Сейчас: переведите 1 275 PKOIN гаранту' },
  { title: 'Решение гаранта', text: 'Перевод продавцу или возврат вам' },
  { title: 'Завершена или отменена', text: 'Оценка покупки и отзыв' },
]

const CALC = [
  ['Стоимость сделки', '1 250 PKOIN'],
  ['Комиссия гаранта · 2%', '25 PKOIN'],
  ['Кто платит комиссию', 'Покупатель'],
]

const delivery = ref('pvz')
const agreed = ref(true)
const txVisible = ref(true)
const modal = ref(false)
const sheet = ref(false)
const how = ref('safe')

function toast(text: string): void {
  showToast(text, { kind: 'info' })
}

function toggleFavorite(index: number): void {
  const card = cards.value[index]
  if (card) card.offer.favorite = !card.offer.favorite
}
</script>

<template>
  <div class="sheet">
    <p class="sheet__lead">
      Из них собираются все страницы. Отдельно — то, чего нет у обычных досок объявлений: статусы
      транзакций, PKOIN, гаранты, цепочки обменов.
    </p>

    <ShowSection
      title="Шапка и навигация"
      note="Одна шапка на всех страницах. Настройки сети и валюты — в верхней строке"
    >
      <div class="frame frame--wide">
        <AppHeader
          messages
          location="Москва · 10 км"
          currency="₽ RUB"
          language="Русский"
          theme-name="системная"
          :user="{ name: 'Анна Ковалёва', seed: 'a', balance: 842.5 }"
          :unread="3"
        />
      </div>
      <div class="phones">
        <div class="stack">
          <span class="sheet__caption">Телефон · верх</span>
          <div class="frame frame--phone">
            <MobileTopBar placeholder="Поиск в Москве" filters-active>
              <UiChip removable :size="32" remove-label="Убрать гео-фильтр">До 10 км</UiChip>
              <UiChip :size="32">Бесплатно</UiChip>
              <UiChip :size="32">С обменом</UiChip>
              <UiChip :size="32">Безопасная сделка</UiChip>
            </MobileTopBar>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Телефон · таб-бар</span>
          <div class="frame frame--phone">
            <TabBar
              :items="[
                { key: 'search' },
                { key: 'favorites' },
                { key: 'create' },
                { key: 'exchanges', dot: true },
                { key: 'profile' },
              ]"
              active="search"
            />
          </div>
        </div>
        <p class="sheet__text">
          Сообщения открывают чат в Bastyon — в десктоп-шапке это иконка с бейджем непрочитанного;
          на телефоне чаты остаются в самом Bastyon, поэтому в таб-баре их нет. Баланс PKOIN рядом с
          аватаром ведёт в кошелёк кабинета.
        </p>
      </div>
    </ShowSection>

    <ShowSection
      title="Карточка объявления"
      note="Фото 4:3 · цена · заголовок · «Меняю на» · место и время"
    >
      <div class="cards" data-testid="cards">
        <div v-for="(card, i) in cards" :key="card.offer.id" class="cards__item">
          <OfferCard :offer="card.offer" @favorite="toggleFavorite(i)" />
          <span class="sheet__caption sheet__caption--small">{{ card.caption }}</span>
        </div>
      </div>
      <div class="rows">
        <div class="stack">
          <span class="sheet__caption">Строка (вид «Список»)</span>
          <OfferRow :offer="row" @favorite="row.favorite = !row.favorite" />
        </div>
        <div class="stack">
          <span class="sheet__caption">Своё объявление в кабинете</span>
          <OwnOfferCard
            title="Велосипед городской Stels"
            :to="DEMO_ITEM"
            :price="{ pkoin: 420 }"
            :status="{ tone: 'success', label: 'Активно до 8 декабря' }"
            :notes="['Автопродление']"
            @more="toast('Меню действий')"
          >
            <UiButton variant="secondary" :size="32" icon="exchange">Обмены · 4</UiButton>
            <UiButton variant="neutral" :size="32">Редактировать</UiButton>
            <UiButton variant="pkoin" :size="32">Продвинуть</UiButton>
          </OwnOfferCard>
          <span class="sheet__caption">Компактная (карусели «Вы смотрели», «Может подойти»)</span>
          <div class="minis">
            <OfferMini v-for="mini in DEMO_MINI" :key="mini.title" v-bind="mini" :to="DEMO_ITEM" />
          </div>
        </div>
      </div>
    </ShowSection>

    <div class="triple">
      <div class="stack">
        <span class="sheet__caption">Липкая колонка объявления</span>
        <div class="panel">
          <div class="stack stack--4">
            <PriceTag
              :price="{ pkoin: 1250, equivalent: { amount: 12400, currency: 'RUB' } }"
              :size="28"
              stacked
            >
              <button type="button" class="currency">
                RUB<UiIcon name="chevron" :size="12" :stroke="2.4" />
              </button>
            </PriceTag>
            <span class="sheet__note"
              >Цена зафиксирована в рублях, PKOIN пересчитывается по курсу</span
            >
          </div>
          <div class="stack stack--8">
            <UiButton :size="52" icon="exchange" block>Предложить обмен</UiButton>
            <UiButton :size="52" variant="contrast" block>Купить</UiButton>
            <UiButton :size="52" variant="neutral" block external>Написать продавцу</UiButton>
          </div>
          <UiAlert tone="success" icon="safe-deal" title="Можно через безопасную сделку">
            Оплата хранится у гаранта до получения. Комиссию оплачивает продавец.
            <a href="#">Как это работает</a>
          </UiAlert>
          <div class="panel__links">
            <UiButton variant="ghost" :size="32" icon="share">Поделиться в Bastyon</UiButton>
            <UiButton variant="ghost" :size="32" icon="complain" class="muted-btn"
              >Пожаловаться</UiButton
            >
          </div>
        </div>
        <div class="panel panel--tight">
          <div class="panel__head">
            <b>Ваше объявление</b>
            <UiBadge tone="success" dot>В сети</UiBadge>
          </div>
          <span class="sheet__text">Активно до 8 декабря · 124 просмотра</span>
          <div class="grid2">
            <UiButton :size="40">Найти обмены</UiButton>
            <UiButton :size="40" variant="neutral">Редактировать</UiButton>
            <UiButton :size="40" variant="pkoin">Продвинуть</UiButton>
            <UiButton :size="40" variant="danger">Снять</UiButton>
          </div>
        </div>
      </div>

      <div class="stack">
        <span class="sheet__caption">Продавец</span>
        <SellerCard
          name="Илья Петров"
          seed="b"
          role="guarantor"
          :rating="4.9"
          :reviews="41"
          since="На Barteron с марта 2023"
          :badges="[{ label: 'Гарант · комиссия 2%', tone: 'success' }, { label: '12 объявлений' }]"
          :profile-to="{ name: 'profile', params: { id: 'PMockUser1111111111111111111111111' } }"
          @open-bastyon="toast('Откроется профиль в Bastyon')"
        />
        <span class="sheet__caption sheet__caption--gap">Модератор — значка нет на макетах</span>
        <SellerCard
          name="Вера Орлова"
          seed="d"
          role="moderator"
          :rating="4.8"
          :reviews="17"
          since="На Barteron с мая 2024"
          :badges="[{ label: 'Модератор', tone: 'primary', icon: 'shield-fill' }]"
          @open-bastyon="toast('Откроется профиль в Bastyon')"
        />
        <span class="sheet__caption sheet__caption--gap">Обмен на странице объявления</span>
        <div class="panel panel--gap14">
          <h3 class="panel__title">Меняю на</h3>
          <ExchangeList
            variant="block"
            :items="[
              { label: 'Ноутбуки', category: true, to: { name: 'category', params: { id: '3' } } },
              { label: 'Планшеты', category: true, match: true },
              { label: 'Игровая приставка' },
            ]"
          />
          <div class="suggest">
            <OfferPhoto class="suggest__photo" ratio="1 / 1" radius="10px" />
            <div class="suggest__text">
              <b>Ваш «Планшет 10″» подходит</b>
              <span>Категория совпадает с запросом продавца</span>
            </div>
            <UiButton :size="36">Предложить</UiButton>
          </div>
          <span class="sheet__note">
            Галочка — категория совпадает с вашим объявлением. Серый тег — свободный текст без
            категории.
          </span>
        </div>
      </div>

      <div class="stack">
        <span class="sheet__caption">Способы получения</span>
        <div class="panel panel--gap10" role="radiogroup" aria-label="Способ получения">
          <UiChoiceCard
            v-model="delivery"
            value="pvz"
            name="delivery"
            title="Пункт выдачи"
            description="3 пункта рядом · от 60 PKOIN · хранение 14 дней"
            trailing-icon="pickup-point"
          >
            <a href="#" class="choice-link">Выбрать на карте</a>
          </UiChoiceCard>
          <UiChoiceCard
            v-model="delivery"
            value="pickup"
            name="delivery"
            title="Самовывоз"
            description="м. Таганская, по договорённости"
            trailing-icon="location"
          />
          <UiChoiceCard
            v-model="delivery"
            value="post"
            name="delivery"
            title="Почтой, транспортной компанией, курьером"
            description="Условия — в описании продавца"
            trailing-icon="delivery"
          />
          <span class="sheet__note"
            >Выбранный способ уходит в чат с продавцом первым сообщением.</span
          >
        </div>
        <span class="sheet__caption sheet__caption--gap">Трёхсторонний обмен</span>
        <div class="panel panel--gap14">
          <ExchangeChain
            :links="[
              { name: 'Вы', item: 'Планшет', you: true },
              { name: 'Анна', item: 'Велосипед' },
              { name: 'Олег', item: 'Ноутбук → вам' },
            ]"
          />
          <p class="sheet__text">
            Ваш планшет нужен Анне, её велосипед — Олегу, а ноутбук Олега — вам. Каждый отдаёт одно
            и получает то, что хотел.
          </p>
          <UiButton block>Предложить цепочку</UiButton>
        </div>
      </div>
    </div>

    <ShowSection
      title="Статус сети"
      note="Один паттерн для публикации, правки, снятия, отзыва, оценки и перевода. Три уровня: метка → тост → панель"
    >
      <div class="stack">
        <span class="sheet__caption">Метки</span>
        <div class="row">
          <NetStatusBadge
            v-for="s in STATUSES"
            :key="s.status"
            :status="s.status"
            :eta="s.eta"
            @retry="toast('Повторяем отправку')"
          />
        </div>
      </div>
      <div class="net-grid">
        <div class="stack">
          <span class="sheet__caption">Панель транзакции</span>
          <TxPanel
            v-if="txVisible"
            title="Публикуем объявление"
            subtitle="Окно можно закрыть — статус обновится сам"
            :steps="TX_STEPS"
            @close="txVisible = false"
          >
            <template #actions>
              <UiButton variant="neutral" :size="40" @click="txVisible = false">Скрыть</UiButton>
              <UiButton variant="ghost" :size="40">Открыть объявление</UiButton>
            </template>
          </TxPanel>
          <UiButton v-else variant="neutral" :size="40" @click="txVisible = true">
            Показать панель
          </UiButton>
        </div>
        <div class="stack">
          <span class="sheet__caption">Системные баннеры (под шапкой)</span>
          <UiAlert tone="info" busy title="Аккаунт активируется в сети">
            Смотреть объявления можно уже сейчас. Размещение и отзывы станут доступны через
            несколько минут.
          </UiAlert>
          <UiAlert tone="warning" icon="retry" title="Вышла новая версия Barteron">
            Перезапустите приложение, чтобы продолжить без ошибок.
            <template #action>
              <UiButton variant="contrast" :size="32">Перезапустить</UiButton>
            </template>
          </UiAlert>
          <UiAlert tone="danger" title="Нет связи с нодой">
            Показываем сохранённые данные. Новые объявления подгрузятся, когда связь вернётся.
            <template #action>
              <UiButton variant="on-danger" :size="32">Повторить</UiButton>
            </template>
          </UiAlert>
          <UiAlert tone="neutral">
            Настройте уведомления, чтобы не пропустить отклики
            <template #action>
              <UiButton variant="secondary" :size="32">Настроить</UiButton>
            </template>
          </UiAlert>
        </div>
      </div>
    </ShowSection>

    <ShowSection title="Безопасная сделка: трекер и расчёт">
      <template #aside>
        <UiBadge tone="primary" pill class="deal-role">Вы — покупатель</UiBadge>
      </template>
      <template #default>
        <UiTracker :steps="DEAL_STEPS" :current="1" />
        <div class="deal">
          <div class="calc">
            <b class="calc__title">Расчёт</b>
            <div v-for="[label, value] in CALC" :key="label" class="calc__row">
              <span>{{ label }}</span>
              <span class="tabular">{{ value }}</span>
            </div>
            <div class="calc__line" />
            <div class="calc__row calc__row--total">
              <span>Оплата гаранту</span>
              <span class="tabular">1 275 PKOIN</span>
            </div>
          </div>
          <div class="stack stack--12">
            <div class="guarantor">
              <UiAvatar name="Мария" seed="c" :size="40" />
              <div class="guarantor__text">
                <b>Гарант: Мария В.</b>
                <span>Доступна · 128 сделок · 4,9</span>
              </div>
              <BastyonLink @open="toast('Откроется чат в Bastyon')">Чат сделки</BastyonLink>
            </div>
            <UiCheckbox v-model="agreed">
              Гарант подтвердил участие, стоимость согласована с продавцом
            </UiCheckbox>
            <UiButton :size="48" block :disabled="!agreed">Перевести 1 275 PKOIN гаранту</UiButton>
            <span class="sheet__note">
              Оплата — одной транзакцией и только здесь. Статус сменится после подтверждения в
              блокчейне.
            </span>
          </div>
        </div>
      </template>
    </ShowSection>

    <ShowSection title="Диалоги, листы и пустые состояния">
      <div class="dialogs">
        <div class="stack">
          <span class="sheet__caption">Модальное окно и нижний лист</span>
          <div class="row">
            <UiButton variant="danger" @click="modal = true">Снять с публикации…</UiButton>
            <UiButton variant="neutral" @click="sheet = true">Как купить?</UiButton>
          </div>
        </div>
        <div class="stack">
          <span class="sheet__caption">Пусто из-за гео-фильтра</span>
          <UiEmptyState
            icon="location"
            title="В радиусе 10 км ничего нет"
            text="Расширьте область поиска или посмотрите все регионы"
          >
            <UiButton :size="40">Изменить на карте</UiButton>
            <UiButton :size="40" variant="neutral">Все регионы</UiButton>
          </UiEmptyState>
        </div>
        <div class="stack">
          <span class="sheet__caption">Загрузка выдачи</span>
          <div class="skeletons">
            <div
              v-for="w in [
                [80, 50],
                [70, 45],
                [85, 40],
              ]"
              :key="w[0]"
              class="stack stack--8"
            >
              <UiSkeleton ratio="4 / 3" radius="12px" />
              <UiSkeleton :width="`${w[0]}%`" />
              <UiSkeleton :width="`${w[1]}%`" height="14px" />
            </div>
          </div>
        </div>
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
          name="how-m"
          icon="safe-deal"
          title="Безопасная сделка"
          description="Деньги у гаранта до получения товара"
        />
        <UiChoiceCard
          v-model="how"
          value="direct"
          name="how-m"
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

.sheet__text {
  font-size: 13px;
  line-height: 19px;
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

.sheet__caption--small {
  font-size: 11px;
}

.sheet__caption--gap {
  margin-top: 14px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.stack--4 {
  gap: 4px;
}
.stack--8 {
  gap: 8px;
}
.stack--12 {
  gap: 12px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* Header demo */
.frame {
  overflow: hidden;
  border-radius: var(--radius-l);
  box-shadow: 0 0 0 1px var(--border);
  background: var(--surface);
}

.frame--wide :deep(.container) {
  max-width: none;
}

.phones {
  display: grid;
  grid-template-columns: 390px 390px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.phones .sheet__text {
  padding-top: 22px;
}

/* Cards */
.cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.cards__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.rows {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
  align-items: start;
}

.minis {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

/* Item page blocks */
.triple {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.panel {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel--tight {
  padding: 20px 24px;
  gap: 12px;
}

.panel--gap14 {
  gap: 14px;
}

.panel--gap10 {
  gap: 10px;
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.panel__title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.panel__links {
  display: flex;
  justify-content: space-between;
  margin: 0 -8px;
}

.panel__links .muted-btn {
  --fg: var(--text2);
}

.currency {
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-s);
  background: var(--muted);
  color: var(--text2);
  font: 500 12px / 16px var(--font-sans);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.suggest {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--primary-soft);
}

.suggest__photo {
  flex: none;
  width: 44px;
}

.suggest__photo :deep(.ui-icon) {
  width: 20px;
  height: 20px;
}

.suggest__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text2);
}

.suggest__text b {
  font-size: 14px;
  color: var(--text);
}

.choice-link {
  margin-top: 4px;
  font-size: 13px;
}

/* Network */
.net-grid {
  display: grid;
  grid-template-columns: 5fr 4fr;
  gap: 24px;
  align-items: start;
}

/* Safe deal */
.deal-role {
  font-size: 13px;
  padding: 5px 12px;
}

.deal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.calc {
  padding: 20px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calc__title {
  font-size: 15px;
}

.calc__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.calc__row span:first-child {
  color: var(--text2);
}

.calc__row--total {
  font-size: 16px;
  font-weight: 700;
}

.calc__row--total span:first-child {
  color: var(--text);
}

.calc__line {
  height: 1px;
  background: var(--border);
}

.guarantor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px var(--border);
  font-size: 13px;
}

.guarantor__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--text3);
}

.guarantor__text b {
  font-size: 14px;
  color: var(--text);
}

/* Dialogs */
.dialogs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.skeletons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1279px) {
  .cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rows,
  .net-grid,
  .dialogs {
    grid-template-columns: 1fr;
  }

  .triple {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .phones {
    grid-template-columns: repeat(2, minmax(0, 390px));
  }

  .phones .sheet__text {
    grid-column: 1 / -1;
    padding-top: 0;
  }
}

@media (max-width: 1023px) {
  .triple,
  .deal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .sheet__lead {
    font-size: 15px;
    line-height: 22px;
  }

  .frame--wide {
    display: none;
  }

  .phones {
    grid-template-columns: 1fr;
  }

  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 8px;
  }

  .panel {
    padding: 16px;
  }
}
</style>
