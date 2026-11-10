import '@fontsource-variable/onest'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './styles/tokens.css'
import './styles/base.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { createAppRouter } from './router'
import { useSessionStore } from './stores/session'
import { useThemeStore } from './stores/theme'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(i18n).use(createAppRouter())
useThemeStore(pinia).apply()
app.mount('#app')

void useSessionStore(pinia).start({
  sdkHost: import.meta.env.VITE_SDK_HOST,
  allowMock: import.meta.env.VITE_ALLOW_MOCK === 'true',
})
