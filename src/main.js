import Vue from "vue";
import App from "./App.vue";
import router from "./router.js";
import i18n from "./i18n/index.js";

import Categories from "@/js/categories.js"
import Barters from "@/js/barters.js"

Vue.config.productionTip = false;

/**
 * Require components from subfolders
 * 
 * @param {require.context[]} context 
 */
const vRequire = (context) => {
	context.forEach(src => {
		src.keys().forEach(path => {
			const
				chunks = path.split("/"),
				componentName = chunks.slice(1, chunks.length - 1).join("-"),
				componentPath = src.resolve(path).replace("./src/", "");
			
			Vue.component(
				componentName,
				() => import(`@/${ componentPath }`)
			);
		});
	});
}

/* Require v-components */
vRequire([
	require.context("@/components/v-layout", true, /index\.vue$/),
	require.context("@/components/v-form", true, /index\.vue$/)
]);

/* Make categories and barters global */
Vue.prototype.categories = Categories;
Vue.prototype.barters = Barters;

/* Add mixin for accessing sibling components in a route */
Vue.mixin({
	computed: {
		routeComponents() {
			return Object.assign({}, this.$route.matched[0].instances);
		}
	}
});

new Vue({
	router,
	i18n,
	render: h => h(App)
}).$mount("#app");