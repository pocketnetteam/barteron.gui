import Vue from "vue";
import App from "./App.vue";
import router from "./router.js";
import i18n from "./i18n/index.js";

Vue.config.productionTip = false;

/*
Import components dynamically from
@/components/elements/*
*/
require.context(
	"@/components/v-form",
	true,
	/index\.vue$/
).keys().forEach(path => {
	Vue.component(
		path.split("/").splice(1).shift(),
		() => import(`@/components/v-form/${ path.replace("./", "") }`)
	);
});

new Vue({
	router,
	i18n,
	render: h => h(App)
}).$mount("#app");