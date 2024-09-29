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
		 * Get default value of location radius in kilometers
		 * 
		 * @returns {Number}
		 */
		defaultRadius() {
			return 10;
		},

		/**
		 * Get max value of location radius in kilometers
		 * 
		 * @returns {Number}
		 */
		maxRadius() {
			return 6000;
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
		 * @param {Number} [data.radius]
		 * @param {Number} [data.units]
		 * 
		 * @returns {Array}
		 */
		getGeoHashRadius({
			geohash,
			latitude,
			longitude,
			radius,
			units
		}) {
			if (geohash) {
				const result = GeoHash.decodeGeoHash(geohash);
				latitude = result.latitude[0];
				longitude = result.longitude[0];
			}

			if (!latitude || !longitude) return [];

			radius = radius || this.defaultRadius;

			const { precision, geohashCellLength } = this.getGeohashPrecision(radius);

			return getHashesNear(
				{ latitude, longitude },
				precision,
				radius + geohashCellLength * Math.sqrt(2) / 2,
				units || "kilometers"
			);
		},

		/**
		 * Get geohash precision by radius and base cell length
		 * 
		 * @param {Number} radius
		 * 
		 * @returns {Object}
		 */
		getGeohashPrecision(radius) {
			const geohashPrecisionOfStandardCellSizesInKm = [
				{ p: 1, w: 5000,  h: 5000  },
				{ p: 2, w: 1250,  h: 625   },
				{ p: 3, w: 156,   h: 156   },
				{ p: 4, w: 39.1,  h: 19.5  },
				{ p: 5, w: 4.89,  h: 4.89  },
				{ p: 6, w: 1.22,  h: 0.61  },
				{ p: 7, w: 0.153, h: 0.153 },
				{ p: 8, w: 0.0382, h: 0.0191 },
			];

			const
				precisionsCount = geohashPrecisionOfStandardCellSizesInKm.length,
				baseCellLength = radius * Math.sqrt(2) * 0.999999,
				getGeohashCellLength = (item) => Math.max(item.w, item.h);

			const items = geohashPrecisionOfStandardCellSizesInKm.filter((item, index) => {
				const
					itemLength = getGeohashCellLength(item),
					isLast = (index == (precisionsCount - 1));

				return itemLength <= baseCellLength || isLast;
			});

			const
				target = items[0],
				precision = target.p,
				geohashCellLength = getGeohashCellLength(target);


			return {
				precision,
				geohashCellLength,
			};
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
			const { geohash, radius } = LocationStore.location;
			return geohash ? this.getGeoHashRadius({ geohash, radius }) : null;
		},

		/**
		 * Checking if the offer is inside the circle
		 * 
		 * @param {Object} offer
		 * @param {Objec} circle
		 * 
		 * @returns {Boolean}
		 */
		isOfferInCircle(offer, circle) {
			let result = true;
			if (circle && offer.geohash) {
				const
					[offerLat, offerLon] = this.decodeGeoHash(offer.geohash),
					distance = this.getDistanceBetweenPointsInKm(
						circle.lat,
						circle.lon,
						offerLat,
						offerLon
					);
				result = (distance <= circle.radius);
			}
			return result;
		},

		/**
		 * Get distance between two points in kilometers
		 * 
		 * @param {Number} lat1
		 * @param {Number} lon1
		 * @param {Number} lat2
		 * @param {Number} lon2
		 * 
		 * @returns {Number}
		 */
		getDistanceBetweenPointsInKm(lat1, lon1, lat2, lon2) {
			const
				earthRadiusKm = 6371,
				radPerDeg = 0.017453292519943295,
				deg2Rad = (deg) => deg * radPerDeg;
		  
			const
				dLat = deg2Rad(lat2-lat1),
				dLon = deg2Rad(lon2-lon1);
		  
			lat1 = deg2Rad(lat1);
			lat2 = deg2Rad(lat2);
		  
			const
				a = Math.sin(dLat/2) * Math.sin(dLat/2)
					+ Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2),
				c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			return earthRadiusKm * c;
		},

		/**
		 * Get offers feed
		 */
		getOffersFeedList(center, radius) {
			const location = center
				? this.getGeoHashRadius({ geohash: center, radius })
				: (this.getStoredLocation() || []);
			
			const
				circleCenter = center || LocationStore.location.geohash,
				circleRadius = (center ? radius : LocationStore.location.radius) || this.defaultRadius;

			let circle = null;
			if (circleCenter) {
				const [lat, lon] = this.decodeGeoHash(circleCenter);
				circle = {
					lat,
					lon,
					radius: circleRadius
				};
			};

			this.fetching = true;

			return this.sdk.getBrtOffersFeed({
				location,
				pageSize: 100
			}).then(offers => {
				return offers.filter(offer => offer.active && this.isOfferInCircle(offer, circle));
			}).catch(e => { 
				console.error(e);
			}).finally(() => {
				this.fetching = false;
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
					this.showError(
						this.$t("dialogLabels.node_error", {
							error: this.sdk.errorMessage(action.error?.code)
						})
					);
				}
			}).catch(e => {
				this.$t("dialogLabels.node_error", {
					error: this.sdk.errorMessage(e)
				})
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
					this.showError(
						this.$t("dialogLabels.node_error", {
							error: this.sdk.errorMessage(action.error?.code)
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
		 * Navigate to Profile
		 * 
		 * @returns {Promise}
		 */
		navigateToProfile() {
			/* Navigate to profile */
			return this.$router.replace({
				path: `/profile/${ this.sdk.address }`,
				hash: `#ads`
			}).catch(e => {
				this.showError(e);
			});
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