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
import { i18n } from './i18n'
import { createAppRouter } from './router'
import { useSessionStore } from './stores/session'
import { useThemeStore } from './stores/theme'
import { useTxStore } from './stores/tx'

const pinia = createPinia()
const queryClient = createQueryClient()
const app = createApp(App)
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(i18n)
  .use(createAppRouter())
useThemeStore(pinia).apply()
app.mount('#app')

const session = useSessionStore(pinia)
const tx = useTxStore(pinia)
installTxRefresh(queryClient, tx, () => session.address)

void session
  .start({
    sdkHost: import.meta.env.VITE_SDK_HOST,
    allowMock: import.meta.env.VITE_ALLOW_MOCK === 'true',
  })
  .then(() => tx.start())
