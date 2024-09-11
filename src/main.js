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
import getHashesNear from "geohashes-near";
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
		}
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
		 */
		sendMessage(data) {
			this.sdk.createRoom({
				name: data.name,
				members: data.members
			}).then(({roomid}) => {
				if (data.openRoom) {
					this.sdk.openRoom(roomid);
				}

				this.sdk.sendMessage({
					roomid,
					content: {
						messages: data.messages || [],
						images: data.images || []
					}
				}).catch(e => { 
					console.error(e);
				});

			}).catch(e => { 
				console.error(e);
			});
		},

		/**
		 * Get geohash radius
		 * 
		 * @param {Object} data
		 * @param {String} data.geohash or
		 * @param {Number} data.latitude
		 * @param {Number} data.longitude
		 * @param {Number} [data.precision]
		 * @param {Number} [data.radius]
		 * @param {Number} [data.units]
		 * 
		 * @returns {Array}
		 */
		getGeoHashRadius({
			geohash,
			latitude,
			longitude,
			precision,
			radius,
			units
		}) {
			if (geohash) {
				const result = GeoHash.decodeGeoHash(geohash);
				latitude = result.latitude[0];
				longitude = result.longitude[0];
			}

			if (!latitude || !longitude) return [];

			return getHashesNear(
				{ latitude, longitude },
				precision || 5,
				radius || 10,
				units || "kilometers"
			);
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
		 * Get offers feed
		 */
		getOffersFeedList(location) {
			this.fetching = true;

			return this.sdk.getBrtOffersFeed({
				location: location || this.locationStore.near || [],
				pageSize: 100
			}).then(offers => {
				this.fetching = false;
				return offers.filter(offer => offer.active);
			}).catch(e => { 
				console.error(e);
			});
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
			if (!remove) {
				this.dialog?.instance.view("load", this.$t("dialogLabels.data_node"));
		
				offer.set({
					published: "withdrawed"
				}).then((data) => {
					if (data.transaction) {
						this.dialog?.instance.hide();

						/* Navigate to profile */
						this.$router.replace({
							path: `/profile/${ this.sdk.address }`,
							hash: `#ads`
						}).catch(e => {
							this.showError(e);
						});
					} else {
						this.showError(
							this.$t("dialogLabels.node_error", {
								error: this.sdk.errorMessage(data.error?.code)
							})
						);
					}
				}).catch(e => {
					this.$t("dialogLabels.node_error", {
						error: this.sdk.errorMessage(e)
					})
				});
			}
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
			}).then(data => {
				if (data.transaction) {
					this.dialog?.instance.hide();

					/* Navigate to profile */
					this.$router.replace({
						path: `/profile/${ this.sdk.address }`,
						hash: `#ads`
					}).catch(e => {
						this.showError(e);
					});
				} else {
					this.showError(
						this.$t("dialogLabels.node_error", {
							error: this.sdk.errorMessage(data.error?.code)
						})
					);
				}
			}).catch(e => {
				this.showError(
					this.$t("dialogLabels.node_error", {
						error: this.sdk.errorMessage(e)
					})
				);
			});
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", e);
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