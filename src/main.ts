import '@fontsource-variable/onest'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './styles/tokens.css'
import './styles/base.css'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { createQueryClient, installTxRefresh } from './api/queries'
import { i18n, setLocale } from './i18n'
import { installErrorHandler } from './lib/app-errors'
import { createAppRouter } from './router'
import { followHostRoutes } from './sdk/host-route'
import { useLocaleStore } from './stores/locale'
import { useSessionStore } from './stores/session'
import { useThemeStore } from './stores/theme'
import { useTxStore } from './stores/tx'

const pinia = createPinia()
const queryClient = createQueryClient()
const router = createAppRouter()
const app = createApp(App).use(pinia).use(VueQueryPlugin, { queryClient }).use(i18n).use(router)
installErrorHandler(app)
useThemeStore(pinia).apply()
// Texts come per language: the first ones before anything is drawn.
void setLocale(i18n.global.locale.value).then(() => app.mount('#app'))

const session = useSessionStore(pinia)
const tx = useTxStore(pinia)
// The user's language choice goes on top of Bastyon's.
useLocaleStore(pinia)
installTxRefresh(queryClient, tx, () => session.address)

void session
  .start({
    sdkHost: import.meta.env.VITE_SDK_HOST,
    allowMock: import.meta.env.VITE_ALLOW_MOCK === 'true',
  })
  .then(() => {
    session.sdk?.on(
      'balance',
      () => void queryClient.invalidateQueries({ queryKey: ['bastyon', 'balance'] })
    )
    // The previous Bastyon asks to open another Barteron page (a link from a chat).
    if (session.sdk) followHostRoutes(session.sdk, router)
    return tx.start()
  })
