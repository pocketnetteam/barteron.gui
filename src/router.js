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
	/**
	 * Apply pid to route
	 */
	{
		path: "/pid/:pid",
		beforeEnter: (to, from, next) => {
			if (to?.params?.pid) {
				const path = atob(to.params.pid);

				/* Apply pid to history state */
				console.group("Read state from history");
				console.log(`pid: \n%c${ to.params.pid }`, `color: blue;`);
				console.log(`path: \n%c${ path }`, `color: blue;`);
				console.groupEnd();

				next({ path, query: { pid: to.params.pid } });
			} else {
				next();
			}
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
		} else {
			return {x: 0, y: 0}
		}
	},
	routes
});

/**
 * Make pid from route
 */
router.beforeEach((to, from, next) => {
	if (!to?.params?.pid && !to?.query?.pid) {
		const pid = btoa(to.fullPath);

		/* Push to history state */
		console.group("Push state to history");
		console.log(`path: \n%c${ to.fullPath }`, `color: blue;`);
		console.log(`pid: \n%c${ pid }`, `color: blue;`);
		console.groupEnd();
	}

	next();
});

export default router;