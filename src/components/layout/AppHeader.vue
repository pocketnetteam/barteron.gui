<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatPkoin } from '@/lib/format'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import AppLogo from './AppLogo.vue'
import SearchBar from './SearchBar.vue'

/**
 * One header for every page (desktop and tablet, ≥ 768 px). Network and
 * currency settings live in the top strip. Messages open the chat in Bastyon;
 * the PKOIN balance next to the avatar leads to the cabinet wallet.
 * Presentational: stage 3 wires it to the stores and the router.
 */
const props = defineProps<{
  /** «Москва · 10 км» */
  location: string
  /** «₽ RUB» */
  currency: string
  language: string
  /** «системная» */
  themeName: string
  /** Signed in: balance and avatar instead of nothing. */
  user?: { name: string; seed?: string; avatar?: string | null; balance?: number | null }
  unread?: number
  /**
   * «Сообщения в Bastyon». Off in the app: neither host lets an app open the
   * list of chats yet; the showcase draws it as in the mockup.
   */
  messages?: boolean
  /** Not signed in: «Войти» instead of the avatar. */
  signIn?: string
  /** The categories menu is open: the button turns into «× Все категории». */
  categoriesOpen?: boolean
  /** «В категории»: the search runs in the current category. */
  searchScope?: string
  searchPlaceholder?: string
  /** The map page (s2-map-desktop): no top strip, «Списком» instead of the personal buttons. */
  compact?: boolean
  /** «Списком»: back to the list from the map. */
  listLabel?: string
}>()

const query = defineModel<string>('query', { default: '' })

/** Buttons that open a panel pass themselves: the panel opens under them. */
defineEmits<{
  location: [anchor: HTMLElement]
  tips: []
  safeDeal: []
  referral: []
  currency: [anchor: HTMLElement]
  language: [anchor: HTMLElement]
  theme: [anchor: HTMLElement]
  support: []
  categories: []
  search: [query: string]
  searchFocus: [form: HTMLElement]
  searchKeydown: [event: KeyboardEvent]
  searchScope: [anchor: HTMLElement]
  favorites: []
  messages: []
  account: [anchor: HTMLElement]
  signIn: []
  create: []
  list: []
}>()

const el = (event: Event) => event.currentTarget as HTMLElement

const { t, locale } = useI18n()

const balance = computed(() =>
  props.user?.balance === null || props.user?.balance === undefined
    ? null
    : formatPkoin(props.user.balance, locale.value)
)
</script>

<template>
  <header class="header">
    <div v-if="!compact" class="header__strip">
      <div class="container header__strip-row">
        <div class="header__strip-group">
          <button
            type="button"
            class="header__strip-btn header__strip-btn--strong"
            data-testid="header-location"
            @click="$emit('location', el($event))"
          >
            <UiIcon name="location" :size="14" :stroke="2" />{{ location }}
          </button>
          <button type="button" class="header__strip-btn header__optional" @click="$emit('tips')">
            {{ t('header.tips') }}
          </button>
          <button
            type="button"
            class="header__strip-btn header__optional"
            @click="$emit('safeDeal')"
          >
            {{ t('header.safeDeal') }}
          </button>
          <button
            type="button"
            class="header__strip-btn header__optional"
            @click="$emit('referral')"
          >
            {{ t('header.referral') }}
          </button>
        </div>
        <div class="header__strip-group">
          <button
            type="button"
            class="header__strip-btn"
            data-testid="header-currency"
            @click="$emit('currency', el($event))"
          >
            {{ currency }}<UiIcon name="chevron" :size="12" :stroke="2.4" />
          </button>
          <button
            type="button"
            class="header__strip-btn"
            data-testid="header-language"
            @click="$emit('language', el($event))"
          >
            {{ language }}<UiIcon name="chevron" :size="12" :stroke="2.4" />
          </button>
          <button
            type="button"
            class="header__strip-btn"
            data-testid="header-theme"
            @click="$emit('theme', el($event))"
          >
            {{ t('header.theme', { name: themeName }) }}
          </button>
          <button
            type="button"
            class="header__strip-btn header__optional"
            @click="$emit('support')"
          >
            {{ t('header.support') }}
          </button>
        </div>
      </div>
    </div>

    <div class="container header__main">
      <AppLogo />
      <UiButton
        class="header__categories"
        :variant="categoriesOpen ? 'contrast' : 'secondary'"
        :icon="categoriesOpen ? 'close' : 'tiles'"
        :aria-expanded="categoriesOpen"
        data-testid="header-categories"
        @click="$emit('categories')"
      >
        <span class="header__label">{{ t('header.allCategories') }}</span>
      </UiButton>
      <SearchBar
        v-model="query"
        class="header__search"
        :scope="searchScope"
        :placeholder="searchPlaceholder"
        @submit="$emit('search', $event)"
        @focus="$emit('searchFocus', $event)"
        @keydown="$emit('searchKeydown', $event)"
        @scope="$emit('searchScope', $event)"
      />
      <UiButton
        v-if="listLabel"
        class="header__list"
        variant="neutral"
        icon="rows"
        data-testid="to-list"
        @click="$emit('list')"
      >
        <span class="header__label">{{ listLabel }}</span>
      </UiButton>
      <div v-if="!compact" class="header__actions">
        <button
          type="button"
          class="header__icon"
          :aria-label="t('header.favorites')"
          @click="$emit('favorites')"
        >
          <UiIcon name="heart" />
        </button>
        <button
          v-if="messages"
          type="button"
          class="header__icon"
          :aria-label="unread ? t('header.messagesUnread', unread) : t('header.messages')"
          @click="$emit('messages')"
        >
          <UiIcon name="chat" />
          <span v-if="unread" class="header__unread" aria-hidden="true">{{
            unread > 99 ? '99+' : unread
          }}</span>
        </button>
        <button
          v-if="user"
          type="button"
          class="header__account"
          :aria-label="t('header.account')"
          data-testid="header-account"
          @click="$emit('account', el($event))"
        >
          <span v-if="balance !== null" class="header__balance">
            <UiIcon class="header__pkoin" name="pkoin" :size="18" :stroke="2" />
            <span class="visually-hidden">{{ t('header.balance') }}</span>
            {{ balance }}
          </span>
          <UiAvatar :name="user.name" :seed="user.seed" :src="user.avatar" :size="32" />
        </button>
        <UiButton
          v-else-if="signIn"
          class="header__sign-in"
          variant="secondary"
          @click="$emit('signIn')"
        >
          {{ signIn }}
        </UiButton>
      </div>
      <UiButton class="header__create" icon="plus" @click="$emit('create')">
        <span class="header__label">{{ t('header.create') }}</span>
      </UiButton>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

/* The host close button may sit at the top right (lib/host-insets.ts). */
.header .container {
  padding-right: max(var(--page-pad), var(--host-corner, 0px));
}

.header__strip {
  background: var(--subtle);
}

.header__strip-row {
  min-height: 36px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 20px;
}

.header__strip-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 20px;
}

.header__strip-btn {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 13px / 18px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
}

.header__strip-btn--strong {
  color: var(--text);
}

.header__strip-btn:hover {
  color: var(--text);
}

.header__strip-btn:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 3px var(--ring);
}

.header__main {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__categories,
.header__create,
.header__list {
  flex: none;
}

.header__search {
  flex: 1 1 320px;
}

.header__actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.header__icon {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-m);
  background: transparent;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header__icon:hover {
  background: var(--muted);
}

.header__unread {
  position: absolute;
  top: 6px;
  right: 5px;
  box-sizing: border-box;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  border: 2px solid var(--surface);
  background: var(--danger);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header__account {
  height: 44px;
  margin-left: 6px;
  padding: 0 6px 0 12px;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 10px;
}

.header__account:hover {
  background: var(--muted-hover);
}

.header__balance {
  display: flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.header__pkoin {
  color: var(--pkoin);
}

.header__icon:focus-visible,
.header__account:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

/* Tablet and small desktop: labels give way to the search field. */
@media (max-width: 1099px) {
  .header__main {
    gap: 10px;
  }

  .header__label {
    display: none;
  }

  .header__categories,
  .header__create,
  .header__list {
    width: 44px;
    padding: 0;
  }

  .header__optional {
    display: none;
  }
}
</style>
