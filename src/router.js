import Vue from "vue";
import VueRouter from 'vue-router';

const routes = [
	{
		path: "/",
		name: "Home",
		component: () => import("@/views/Home/index.vue")
	},
	{
		path: "/about",
		name: "About",
		component: () => import("@/views/About/index.vue"),
	},
];

Vue.use(VueRouter);

export default new VueRouter({
  routes,
  mode: "history",
});