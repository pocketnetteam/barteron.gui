import Vue from "vue";
import VueRouter from 'vue-router';

const routes = [
	{
		path: "/",
		name: "home",
		component: () => import("@/views/Home/index.vue")
	},
	{
		path: "/category/:slug",
		name: "category",
		components: {
			default: () => import("@/views/Category/index.vue"),
			aside: () => import("@/views/Category/aside/index.vue"),
			content: () => import("@/views/Category/content/index.vue")
		}
	},
	{
		path: "/barter/create",
		name: "createBarter",
		components: {
			default: () => import("@/views/Barter/Create/index.vue"),
			aside: () => import("@/views/Barter/Create/aside/index.vue"),
			content: () => import("@/views/Barter/Create/content/index.vue")
		}
	},
	{
		path: "/barter/added",
		name: "addedBarter",
		components: {
			content: () => import("@/views/Barter/Added/content/index.vue")
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
		component: () => import("@/views/About/index.vue"),
	}
];

Vue.use(VueRouter);

export default new VueRouter({
  routes,
  mode: "history",
});