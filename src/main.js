import Vue from "vue";
import App from "./App.vue";
import store from "./stores/store.js";
import router from "./router.js";
import i18n from "./i18n/index.js";

import Manifest from "../public/b_manifest.json";
import SDK from "@/js/sdk.js";
import Categories from "@/js/categories.js";
import Favorites from "@/data/favorites.json";

import { GeoHash } from "geohash";
import { GeoHashApproximator } from "@/js/geohashUtils.js";
import LocationStore from "@/stores/location.js";
import { Promise } from "core-js";

import vIntersection from "@/directives/v-intersection";

Vue.config.productionTip = false;

/* Register directives */
Vue.directive("intersection", vIntersection);

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
Vue.component("v-video", () => import("@/components/v-form/v-video/index.vue"));
Vue.component("v-select", () => import("@/components/v-form/v-select/index.vue"));
Vue.component("v-switch", () => import("@/components/v-form/v-switch/index.vue"));
Vue.component("v-tabs", () => import("@/components/v-form/v-tabs/index.vue"));
Vue.component("v-textarea", () => import("@/components/v-form/v-textarea/index.vue"));

/* Make categories and barters global */
Vue.prototype.manifest = Manifest;
Vue.prototype.sdk = Vue.observable(new SDK());
Vue.prototype.categories = Vue.observable(new Categories());
Vue.prototype.favorites = Favorites;
Vue.prototype.shared = Vue.observable({
	computed: {
		/* Access siblings components in a route */
		$components() {
			return Vue.observable(this.$route.matched[0].instances);
		},

		/* Get bastyon address */
		address() {
			return this.sdk.address;
		},

		/**
		 * Get me
		 * 
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.sdk.address];
		},

		/**
		 * Get my Barteron account
		 * 
		 * @returns {@Account}
		 */
		account() {
			return this.sdk.barteron.accounts[this.sdk.address];
		},

		/**
		 * Get my geoposition
		 * 
		 * @returns {Object}
		 */
		locationStore() {
			return Vue.observable({
				...LocationStore.location,
				set: LocationStore.set,
				reset: LocationStore.reset
			});
		},
	},

	methods: {
		/* isEmpty: this.sdk.empty,
		ifEmpty: this.sdk.ifEmpty, */

		/**
		 * 
		 * @param {Function} fn
		 * @param {Number} timeout
		 * 
		 * @returns {Function}
		 */
		debounce(fn, timeout = 300) {
			let timer;
			
			const debounced = (...args) => {
				clearTimeout(timer);
				timer = setTimeout(() => fn.apply(this, args), timeout);
			};

			debounced.cancel = () => clearTimeout(timer);

			return debounced;
		},

		/**
		 * Get map height
		 * 
		 * @returns {String|undefined}
		 */
		mapHeight() {
			let result = undefined;
			const value = getComputedStyle(document.documentElement).getPropertyValue('--device-size-large');
			if (value) {
				const 
					query = `screen and (max-width: ${value})`,
					exceedsQuerySize = !(window.matchMedia(query).matches);
				
				if (exceedsQuerySize) {
					result = "560px"
				}
			}
			return result;
		},

		/**
		 * Vue2 watch
		 * 
		 * @param {String} prop
		 * @param {Function} fn
		 * 
		 * @returns {Promise}
		 */
		$2watch(prop, fn) {
			return new Promise(resolve => {
				const
					value = () => new Function("_", `return _.${ prop }`)(this),
					oldVal = { ...value() },
					interval = setInterval(() => {
						const newVal = value();

						if (newVal) {
							clearInterval(interval);
							resolve(newVal);
							if (typeof fn === "function") fn(newVal, oldVal);
						}
					}, 10);
			});
		},

		/**
		 * Wait for refs
		 * 
		 * @param {String} refs - string of refs (example: "ref1,ref2")
		 * 
		 * @returns {Promise}
		 */
		waitForRefs(refs) {
			const items = (refs || [])
				.split(",")
				.map(ref => ref.trim())
				.filter(f => f)
				.map(ref => this.$2watch(`$refs.${ref}`));

			return Promise.all(items);
		},

		/**
		 * Scroll To
		 * 
		 * @param {String} el
		 * @param {Object} [options]
		 */
		scrollToElement(el, options) {
			const scrollTarget = (() => {
				if (el?.scrollIntoView) {
					return el;
				} else {
					return document.querySelector(el);
				}
			})();

			scrollTarget.scrollIntoView({ behavior: "smooth", ...options });
		},

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
		},

		/**
		 * Get absolute path from path
		 * 
		 * @param {String} path
		 * 
		 * @returns {String}
		 */
		imageUrl(path) {
			if (["http", "data:image"].some(str => path?.startsWith && path.startsWith(str))) {
				return path;
			} else {
				try {
					return require(`@/assets/images/${ path }`)
				} catch {
					return null;
				}
			}
		},

		/**
		 * Create or open room and send message
		 * 
		 * @param {Object} data
		 * @param {String} data.name
		 * @param {Array} data.members
		 * @param {Array} [data.messages]
		 * @param {Array} [data.images]
		 * @param {Boolean} [data.openRoom]
		 * 
		 * @returns {Promise}
		 */
		sendMessage(data) {
			return this.sdk.createRoom({
				name: data.name,
				members: data.members
			}).then(({roomid}) => {
				return data.openRoom ?
					this.sdk.openRoom(roomid).then(() => roomid)
					: roomid;
			}).then(roomid => {
				return this.sdk.sendMessageInRoom({
					roomid,
					content: {
						messages: data.messages || [],
						images: data.images || []
					}
				});
			})
		},

		/**
		 * Encode geohash
		 * 
		 * @param {Array} latlng
		 */
		encodeGeoHash(latlng) {
			return GeoHash.encodeGeoHash.apply(null, latlng);
		},

		/**
		 * Decode geohash
		 * 
		 * @returns {Array|null}
		 */
		decodeGeoHash(geohash) {
			if (geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
		},

		/**
		 * Get stored location
		 * 
		 * @returns {Array|null}
		 */
		getStoredLocation() {
			let result = null;
			const { bounds } = LocationStore.location;
			if (bounds) {
				const approximator = new GeoHashApproximator(bounds);
				result = approximator.getGeohashItems(bounds);
			}
			return result;
		},

		/**
		 * Withdraw of Remove an Offer Dialog
		 * 
		 * @param {@Offer} offer
		 * @param {Boolean} remove
		 */
		withdrawOfferDialog(offer, remove = false) {
			this.dialog?.instance
				.view("question", this.$t(`dialogLabels.offer_${ remove ? 'delete' : 'withdraw' }`))
				.then(state => {
					if (state) {
						this.withdrawOffer(offer, remove);
					}
				});
		},

		/**
		 * Withdraw of Remove an Offer
		 * 
		 * @param {@Offer} offer
		 * @param {Boolean} remove
		 */
		withdrawOffer(offer, remove = false) {
			this.dialog?.instance.view("load", this.$t("dialogLabels.data_node"));
			if (!remove) {
				this.withdrawOfferHandler( offer.set({ published: "withdrawed" }) );
			} else {
				this.withdrawOfferHandler( offer.remove() );
			}
		},

		withdrawOfferHandler(promise) {
			promise.then(action => {
				if (action.transaction) {
					this.dialog?.instance.hide();
					this.navigateToProfile();
				} else {
					const details = action.error?.code 
						? this.sdk.errorMessage(action.error?.code)
						: null;
					this.showError(null, { key: "dialogLabels.node_error", details })
				}
			}).catch(e => {
				this.showError(e, { key: "dialogLabels.node_error" })
			});
		},

		/**
		 * Renew Offer Dialog
		 * 
		 * @param {@Offer} offer
		 */
		renewOfferDialog(offer) {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.offer_renew"))
				.then(state => {
					if (state) {
						this.renewOffer(offer);
					}
				});
		},

		/**
		 * Renew an Offer
		 * 
		 * @param {@Offer} offer
		 */
		renewOffer(offer) {
			this.dialog?.instance.view("load", this.$t("dialogLabels.data_node"));

			offer.set({
				published: "published"
			}).then(action => {
				if (action.transaction) {
					this.dialog?.instance.hide();
					this.navigateToProfile();
				} else {
					const details = action.error?.code 
						? this.sdk.errorMessage(action.error?.code)
						: null;
					this.showError(null, { key: "dialogLabels.node_error", details })
				}
			}).catch(e => {
				this.showError(e, { key: "dialogLabels.node_error" })
			});
		},

		/**
		 * Navigate to Profile
		 * 
		 * @returns {Promise}
		 */
		navigateToProfile() {
			const 
				to = {
					path: `/profile/${ this.sdk.address }`,
					hash: `#ads`
				},
				from = this.$route,
				needReplace = !(this.routesAreEqual(to, from, ['path', 'hash']));
			
			if (needReplace) {
				return this.$router.replace(to).catch(e => {
					console.error(e);
				});
			}
		},

		/**
		 * Checks if routes are equal
		 * 
		 * @param {Object} route1
		 * @param {Object} route2
		 * @param {Array} keys
		 * 
		 * @returns {Boolean}
		 */
		routesAreEqual(route1, route2, keys) {
			return keys.reduce((result, item) => {
				return result = result && JSON.stringify(route1[item]) === JSON.stringify(route2[item]);
			}, true);
		},

		/**
		 * Show info
		 * 
		 * @param {String} message
		 */
		showInfo(message) {
			this.dialog?.instance.view("info", message);
		},

		/**
		 * Show warning
		 * 
		 * @param {String} message
		 */
		showWarning(message) {
			this.dialog?.instance.view("warn", message);
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e, options) {
			this.dialog?.instance.view("error", this.sdk.errorMessage(e, options));
		}
	}
});

Vue.mixin(Vue.prototype.shared);

/**
 * StartUp
 */
new Vue({
	router,
	store,
	i18n,
	render: h => h(App)
}).$mount("#app");