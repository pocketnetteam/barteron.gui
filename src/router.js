import Vue from "vue";
import VueRouter from "vue-router";
import offerStore from "@/stores/offer.js";

const routes = [
	{
		path: "/",
		name: "home",
		components: {
			default: () => import("@/views/Home/index.vue"),
			content: () => import("@/views/Category/content/index.vue")
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
		path: "/barter/safedeal",
		name: "SafeDeal",
		components: {
			default: () => import("@/views/Barter/SafeDeal/index.vue"),
			aside: () => import("@/views/Barter/SafeDeal/aside/index.vue"),
			content: () => import("@/views/Barter/SafeDeal/content/index.vue"),
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
		const 
			scrollOffset = offerStore.scrollOffset,
			isReturnToOfferListFromItem = (from.name == "barterItem" 
				&& to.fullPath === offerStore.itemsRoute?.fullPath
			);
		
		if (isReturnToOfferListFromItem && scrollOffset) {
			document.body.scrollTo({
				top: scrollOffset.y,
				left: scrollOffset.x,
				behavior: "instant",
			});
			offerStore.scrollOffset = null;
			return;
		}

		if (to.hash) {
			const 
				selector = to.hash.replace("#", ""),
				el = document.querySelector(selector);

			if (el) {
				el.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
				return;
			};
			return {selector: to.hash}
		} else if(savedPosition) {
			document.body.scrollTo({
				top: savedPosition.y || 0,
				left: savedPosition.x || 0,
				behavior: "instant",
			});
			return;
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

export default router;