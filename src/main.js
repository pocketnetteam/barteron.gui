import Vue from "vue";
import App from "./App.vue";
import router from "./router.js";
import i18n from "./i18n/index.js";

import Manifest from "../public/b_manifest.json";
import SDK from "@/js/sdk.js";
import Categories from "@/js/categories.js";
import Barters from "@/js/barters.js";
import Favorites from "@/data/favorites.json";

Vue.config.productionTip = false;

/* Register layout components */
Vue.component("v-header", () => import("@/components/v-layout/v-header/index.vue"));
Vue.component("v-content", () => import("@/components/v-layout/v-content/index.vue"));
Vue.component("v-aside", () => import("@/components/v-layout/v-aside/index.vue"));
Vue.component("v-sidebar", () => import("@/components/v-layout/v-sidebar/index.vue"));
Vue.component("v-footer", () => import("@/components/v-layout/v-footer/index.vue"));
Vue.component("v-page-header", () => import("@/components/v-layout/v-page-header/index.vue"));
Vue.component("v-page-header-title", () => import("@/components/v-layout/v-page-header/title/index.vue"));
Vue.component("v-page-footer", () => import("@/components/v-layout/v-page-footer/index.vue"));

/* Register form components */
Vue.component("v-button", () => import("@/components/v-form/v-button/index.vue"));
Vue.component("v-details", () => import("@/components/v-form/v-details/index.vue"));
Vue.component("v-dialog", () => import("@/components/v-form/v-dialog/index.vue"));
Vue.component("v-form", () => import("@/components/v-form/v-form/index.vue"));
Vue.component("v-input", () => import("@/components/v-form/v-input/index.vue"));
Vue.component("v-lightbox", () => import("@/components/v-form/v-lightbox/index.vue"));
Vue.component("v-map", () => import("@/components/v-form/v-map/index.vue"));
Vue.component("v-photos", () => import("@/components/v-form/v-photos/index.vue"));
Vue.component("v-select", () => import("@/components/v-form/v-select/index.vue"));
Vue.component("v-switch", () => import("@/components/v-form/v-switch/index.vue"));
Vue.component("v-tabs", () => import("@/components/v-form/v-tabs/index.vue"));
Vue.component("v-textarea", () => import("@/components/v-form/v-textarea/index.vue"));

/* Make categories and barters global */
Vue.prototype.manifest = Manifest;
Vue.prototype.sdk = Vue.observable(new SDK());
Vue.prototype.categories = Vue.observable(new Categories());
Vue.prototype.barters = Vue.observable(new Barters());
Vue.prototype.favorites = Favorites;

Vue.mixin({
	computed: {
		/* Access siblings components in a route */
		$components() {
			return Vue.observable(this.$route.matched[0].instances);
		}
	},

	methods: {
		/**
		 * Parse labels object from localization
		 * 
		 * @param {String} label
		 * 
		 * @returns {Array}
		 */
		parseLabels(label, exclude = ["label"]) {
			return Object.keys(this.$t(label))
				.filter(label => !exclude.includes(label))
				.map((value, index) => ({
					text: this.$t(`${ label }.${ value }`),
					value,
					default: index === 0
				}));
		}
	}
});

/**
 * StartUp
 */
(async () => {
	const
		sdk = Vue.prototype.sdk,
		address = await sdk.getAddress(),
		account = await sdk.getBrtAccount(address);

	/* Create barteron account automatically */
	if (address && account) {
		if (!account?.[0]) account[0] = new sdk.models.Account({ address }).set();
	}

	/* Create Vue app */
	new Vue({
		router,
		i18n,
		render: h => h(App)
	}).$mount("#app");
})();