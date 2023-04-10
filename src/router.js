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
		path: "/about",
		name: "about",
		component: () => import("@/views/About/index.vue"),
	},
];

Vue.use(VueRouter);

export default new VueRouter({
  routes,
  mode: "history",
});