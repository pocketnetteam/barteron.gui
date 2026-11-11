import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const StubView = () => import('@/views/StubView.vue')
const CatalogView = () => import('@/views/CatalogView.vue')
const MapView = () => import('@/views/MapView.vue')
const OfferView = () => import('@/views/OfferView.vue')
const CreateView = () => import('@/views/CreateView.vue')
const DraftPreview = () => import('@/views/item/DraftPreview.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const ExchangeOptionsView = () => import('@/views/exchange/ExchangeOptionsView.vue')
const ChainView = () => import('@/views/exchange/ChainView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

/** Internal pages: dev and test builds only, cut out of production. */
const devRoutes: RouteRecordRaw[] =
  import.meta.env.VITE_SHOWCASE === 'true'
    ? [
        {
          path: '/dev/ui/:sheet(foundations|components|marketplace|data)?',
          name: 'showcase',
          component: () => import('@/views/dev/ShowcaseView.vue'),
        },
        {
          // What the host told us; the e2e host tests read it.
          path: '/dev/status',
          name: 'status',
          component: () => import('@/views/dev/StatusView.vue'),
        },
      ]
    : []

/**
 * Same paths and names as the old app (barteron.gui `src/router.js`): these
 * links are already shared in chats. Screens are stubs until their stage.
 * New paths are only added, never put over old ones.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  // bastyon-nextgen opens `<scope>/<start_url>`, and the manifest's start_url is
  // `index.html`; the previous host ignores start_url and opens `/`.
  { path: '/index.html', redirect: (to) => ({ path: '/', query: to.query, hash: to.hash }) },
  { path: '/category/:id', name: 'category', component: CatalogView },
  // New: the catalog on a map. `search` as the id means all categories, as in the old app.
  { path: '/category/:id/map', name: 'categoryMap', component: MapView },
  {
    path: '/barter/create/:id?',
    // vue-router requires the alias to declare the param exactly like the path.
    alias: '/barter/edit/:id?',
    name: 'createBarter',
    component: CreateView,
  },
  // «Варианты обмена» of an offer and one chain of three (stage 7), on the old paths.
  { path: '/barter/exchange/:id', name: 'exchangeOptions', component: ExchangeOptionsView },
  { path: '/barter/search', name: 'ThreeSidedSearch', component: ChainView },
  { path: '/barter/safedeal', name: 'SafeDeal', component: StubView },
  { path: '/barter/moderation', name: 'VotingModeration', component: StubView },
  // The form's preview; the old app showed it on the same path (`/barter/draft?preview=1`).
  { path: '/barter/draft', name: 'draftPreview', component: DraftPreview },
  { path: '/barter/:id', name: 'barterItem', component: OfferView },
  // My own address opens the cabinet; sections in the hash, like the old tabs (`#ads`, `#favorites`).
  { path: '/profile/:id', name: 'profile', component: ProfileView },
  { path: '/about', name: 'about', component: StubView },
  ...devRoutes,
  { path: '/404', name: 'notFound', component: NotFoundView },
  { path: '/:pathMatch(.*)*', name: 'unknown', component: NotFoundView },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
    // Back to a list: where it was (its pages are still in the query cache).
    // Filters and sorting on the same page keep the scroll; a new page starts at the top.
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      if (to.path === from.path) return false
      return { top: 0 }
    },
  })
}
