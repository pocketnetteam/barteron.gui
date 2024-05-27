import Vue from "vue";
import VueRouter from "vue-router";

const routes = [
	{
		path: "/",
		name: "home",
		components: {
			default: () => import("@/views/Home/index.vue")
		}
	},
	{
		path: "/category/:id",
		name: "category",
		components: {
			default: () => import("@/views/Category/index.vue"),
			aside: () => import("@/views/Category/aside/index.vue"),
			content: () => import("@/views/Category/content/index.vue")
		}
	},
	{
		path: "/barter/create/:id?",
		alias: "/barter/edit/:id",
		name: "createBarter",
		components: {
			default: () => import("@/views/Barter/Create/index.vue"),
			aside: () => import("@/views/Barter/Create/aside/index.vue"),
			content: () => import("@/views/Barter/Create/content/index.vue")
		}
	},
	{
		path: "/barter/exchange/:id",
		name: "exchangeOptions",
		components: {
			content: () => import("@/views/Barter/Exchange/content/index.vue")
		}
	},
	{
		path: "/barter/search",
		name: "ThreeSidedSearch",
		components: {
			default: () => import("@/views/Barter/ThreeSidedSearch/index.vue"),
			content: () => import("@/views/Barter/ThreeSidedSearch/content/index.vue")
		}
	},
	{
		path: "/barter/:id",
		name: "barterItem",
		components: {
			default: () => import("@/views/Barter/Item/index.vue"),
			content: () => import("@/views/Barter/Item/content/index.vue"),
			sidebar: () => import("@/views/Barter/Item/sidebar/index.vue")
		}
	},
	{
		path: "/profile/:id",
		name: "profile",
		components: {
			aside: () => import("@/views/Profile/aside/index.vue"),
			content: () => import("@/views/Profile/content/index.vue")
		}
	},
	{
		path: "/about",
		name: "about",
		components: {
			default: () => import("@/views/About/index.vue")
		}
	},
	{
		path: "/404",
		alias: "*",
		component: { render: (h) => h("div", ["404! Page Not Found!"]) },
	}
];

Vue.use(VueRouter);

const router = new VueRouter({
	mode: "history",
	duplicateNavigationPolicy: "reload",
	scrollBehavior(to, from, savedPosition) {
		if (to.hash) {
			return {selector: to.hash}
		} else if(savedPosition) {
			return savedPosition;
		} else {
			Vue.nextTick(() => {
				const mixin = Vue.prototype.shared;
				mixin.methods.scrollToElement('#app', {behavior: 'instant'});
			})
		}
	},
	routes
});

router.beforeEach((to, from, next) => {
	/* Push to history state */
	console.log('barteron -> bastyon: ' + to.fullPath)

	next();
});

router.afterEach((to, from) => {
	Vue.prototype.sdk.routeChanged(to, from)
});

export default router;