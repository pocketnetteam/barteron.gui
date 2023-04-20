import Vue from "vue";
import App from "./App.vue";
import router from "./router.js";
import i18n from "./i18n/index.js";

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

vRequire([
	require.context("@/components/v-layout", true, /index\.vue$/),
	require.context("@/components/v-form", true, /index\.vue$/)
]);

new Vue({
	router,
	i18n,
	render: h => h(App)
}).$mount("#app");