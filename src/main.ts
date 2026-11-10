import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { createAppRouter } from './router'
import { useSessionStore } from './stores/session'
import './styles/base.css'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(i18n).use(createAppRouter())
app.mount('#app')

void useSessionStore(pinia).start({
  sdkHost: import.meta.env.VITE_SDK_HOST,
  allowMock: import.meta.env.VITE_ALLOW_MOCK === 'true',
})
