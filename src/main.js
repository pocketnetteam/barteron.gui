import Vue from "vue";
import App from "./App.vue";
import router from "./router.js";

Vue.config.productionTip = false;

/*
Import components dynamically from
@/components/elements/*
*/
require.context(
	"@/components/elements",
	true,
	/index\.vue$/
).keys().forEach(path => {
	Vue.component(
		path.split("/").splice(1).shift(),
		() => import(`@/components/elements/${ path.replace("./", "") }`)
	);
});

new Vue({
	router,
	render: h => h(App)
}).$mount("#app");