import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const StubView = () => import('@/views/StubView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

/**
 * Same paths and names as the old app (barteron.gui `src/router.js`): these
 * links are already shared in chats. Screens are stubs until their stage.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  // bastyon-nextgen opens `<scope>/<start_url>`, and the manifest's start_url is
  // `index.html`; the previous host ignores start_url and opens `/`.
  { path: '/index.html', redirect: (to) => ({ path: '/', query: to.query, hash: to.hash }) },
  { path: '/category/:id', name: 'category', component: StubView },
  {
    path: '/barter/create/:id?',
    // vue-router requires the alias to declare the param exactly like the path.
    alias: '/barter/edit/:id?',
    name: 'createBarter',
    component: StubView,
  },
  { path: '/barter/exchange/:id', name: 'exchangeOptions', component: StubView },
  { path: '/barter/search', name: 'ThreeSidedSearch', component: StubView },
  { path: '/barter/safedeal', name: 'SafeDeal', component: StubView },
  { path: '/barter/moderation', name: 'VotingModeration', component: StubView },
  { path: '/barter/:id', name: 'barterItem', component: StubView },
  { path: '/profile/:id', name: 'profile', component: StubView },
  { path: '/about', name: 'about', component: StubView },
  { path: '/404', name: 'notFound', component: NotFoundView },
  { path: '/:pathMatch(.*)*', name: 'unknown', component: NotFoundView },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({ history, routes })
}
