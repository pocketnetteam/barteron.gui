import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import WorkSchedule from "@/components/work-schedule/index.vue";
import CurrencySwitcher from "@/components/currency-switcher/index.vue";
import Caption from "@/components/barter/item/caption/index.vue";
import Price from "@/components/barter/item/price/index.vue";
import PickupPointList from "@/components/pickup-point/list/index.vue";
import MyOptions from "@/components/barter/item/my-options/index.vue";
import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import LikeStore from "@/stores/like.js";
import PhotoSwipe from "photoswipe";
import "photoswipe/style.css";

export default {
	name: "BarterItem",

	components: {
		ImageLoad,
		Loader,
		ExchangeList,
		WorkSchedule,
		Caption,
		Price,
		PickupPointList,
		MyOptions,
		BarterExchange,
		Profile,
		CurrencySwitcher
	},

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		vType: {
			/* row, tile or item */
			type: String,
			default: "tile"
		},
		hideInfo: {
			type: Boolean,
			default: false
		},
		compactView: {
			type: Boolean,
			default: false
		},
		customLink: {
			type: [String, Object, Function],
			default: null
		}
	},

	data() {
		return {
			hover: 0,
			active: 0,
			addr: {},

			pickupPointItems: [],
			pickupPointsLoading: false,
			pickupPointsLoadingCount: 0,
			pickupPointsLoadingError: null,

			selectedOfferId: null,
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get author address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.item.address;
		},

		/**
		 * Show is this offer is owner's
		 * 
		 * @returns {Boolean}
		 */
		isMyOffer() {
			return this.address === this.sdk.address;
		},

		/**
		 * Get owner account
		 * 
		 * @returns {@Account}
		 */
		ownerAccount() {
			return this.sdk.barteron.accounts[this.address];
		},

		/**
		 * Get pkoin price
		 * 
		 * @returns {String|null}
		 */
		pkoinPrice() {
			let value = this.item?.price;

			const
				currencyPrice = this.item?.currencyPrice,
				fixedCurrency = currencyPrice?.currency?.toUpperCase(),
				fixedPrice = currencyPrice?.price,
				needCalc = (fixedCurrency && fixedPrice);
			
			if (needCalc) {
				const
					rates = this.sdk.currency,
					rate = rates[fixedCurrency],
					isValid = (rate && (typeof rate === "number"));

				value = isValid ? (fixedPrice / rate) : null;
			};

			return value;
		},
		
		/**
		 * Get exchange list
		 * 
		 * @returns {Array}
		 */
		exchangeList() {
			let ids = this.item.tags;

			if (ids?.includes("my_list")) {
				ids = this.ownerAccount?.tags || [];
			} else if (ids?.includes("for_nothing")) {
				ids = [{ value: this.$t("barterLabels.free") }];
			}

			return this.ifEmpty(
				/* Values */
				ids?.map(id => {
					const category = this.categories.items[id];
	
					return {
						...category,
						value: this.$t(category?.name)
					}
				}).filter(c => c.id),

				/* Default if empty */
				[{ id: 99, value: this.$t("everything_else") }]
			);
		},

		/**
		 * Get pickup point data
		 * 
		 * @returns {Object}
		 */
		pickupPoint() {
			return this.item.delivery?.pickupPoint;
		},

		/**
		 * Get price prefix
		 * 
		 * @returns {String}
		 */
		pricePrefix() {
			return this.pickupPoint ? (this.$t("priceLabels.from") + " ") : "";
		},

		/**
		 * Get delivery options data
		 * 
		 * @returns {Object}
		 */
		deliveryOptions() {
			return this.item?.delivery?.deliveryOptions;
		},

		/**
		 * Check if delivery options available
		 * 
		 * @returns {Boolean}
		 */
		deliveryOptionsAvailable() {
			const options = this.deliveryOptions || {};
			return (options.pickupPoints?.isEnabled || options.selfPickup?.isEnabled);
		},

		/**
		 * Get pickup point ids
		 * 
		 * @returns {Array}
		 */
		pickupPointIds() {
			const options = this.deliveryOptions || {};
			return options.pickupPoints?.isEnabled ? options.pickupPoints?.ids || [] : [];
		},

		selfPickupItemId() {
			return "self_pickup";
		},

		/**
		 * Get map mode
		 * 
		 * @returns {String}
		 */
		mapMode() {
			return this.pickupPointIds?.length ? "deliverySelection" : "view";
		},

		/**
		 * Get user location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			const geohash = this.locationStore.geohash;

			this.decodeGeoHash(geohash);
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			return this.decodeGeoHash(this.item.geohash);
		},

		/**
		 * Get address from geohash
		 * 
		 * @returns {null|String}
		 */
		geopos() {
			if (!this.addr.country) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash, {
						"zoom": this.zoom || 18,
						"accept-language": this.sdk.getLanguageByLocale(this.$root.$i18n.locale)
					}).then(result => {
						if (result?.address) this.$set(this, "addr", result.address);
					}).catch(e => { 
						console.error(e);
					}).finally(() => {
						this.addr.fetching = false;
					});
				}

				return null;
			} else {
				return [
					this.addr.country,
					this.addr.city || this.addr.town || this.addr.state || this.addr.county
				].filter(f => f).join(", ");
			}
		},

		/**
		 * Calculate distance from geohash to location
		 * 
		 * @returns {Number}
		 */
		distance() {
			const
				R = 6371, /* Radius of the earth in km */
				toRad = (value) => value * Math.PI / 180,
				lat1 = this.location?.[0],
				lon1 = this.location?.[1],
				lat2 = this.geohash?.[0],
				lon2 = this.geohash?.[1],
				destLat = toRad(lat2 - lat1),
				destLon = toRad(lon2 - lon1),
				radLat1 = toRad(lat1),
				radLat2 = toRad(lat2),
				a = Math.sin(destLat / 2) * Math.sin(destLat /2 ) + Math.sin(destLon / 2) * Math.sin(destLon / 2) * Math.cos(radLat1) * Math.cos(radLat2),
				c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			return parseFloat((R * c).toFixed(1));
		},

		/**
		 * Customize offer link
		 * 
		 * @returns {Object|String}
		 */
		offerLink() {
			if (!this.customLink) {
				return { name: "barterItem", params: { id: this.item.hash } };
			} else if (typeof this.customLink === "function") {
				return this.customLink(this.item, this);
			} else {
				return this.customLink;
			}
		},

		/* Get offer images */
		images() {
			return (this.item.images || []).map(url => this.sdk.manageBastyonImageSrc(url));
		},

		/**
		 * Get like state
		 * 
		 * @returns {Boolean}
		 */
		hasLike() {
			return LikeStore.hasLike(this.item?.hash);
		},

		/**
		 * Show is offer has published
		 * 
		 * @returns {Boolean}
		 */
		hasRelay() {
			return this.item.relay;
		},

		/**
		 * Checking removed status
		 * 
		 * @returns {Boolean}
		 */
		isRemoved() {
			return this.item.status === "removed";
		}
	},

	methods: {
		mapOffers() {
			return this.mapMode === "deliverySelection" 
				? [this.item, ...this.pickupPointItems.filter(f => !(f.isSelfPickup))] 
				: [this.item];
		},

		/**
		 * Set like state
		 */
		setLike() {
			if (!(this.hasRelay || this.isRemoved)) {
				LikeStore.set(this.item?.hash);
			}
		},

		/**
		 * Share item
		 */
		shareItem() {
			if (!(this.hasRelay || this.isRemoved)) {
				const data = {
					path: `barter/${ this.item.hash }`,
					sharing: {
						title: this.$t("itemLabels.label"),
						text: { body: this.item.caption }
					}
				};
				this.sdk.share(data);
			}
		},

		/**
		 * Check return alternative if empty
		 * 
		 * @returns {*}
		 */
		ifEmpty() {
			for (let a in arguments) {
				const prop = arguments[a];
				if (prop?.length) return prop;
			}

			return arguments[arguments.length - 1];
		},

		/**
		 * Click on image
		 * 
		 * @param {Number} index
		 */
		imageClick(index) {
			const options = {
				index,
				initialZoomLevel: "fit",
				secondaryZoomLevel: 2,
				maxZoomLevel: 4,
				wheelToZoom: true,
				showHideAnimationType: "fade"
			};

			const promises = this.images.map(item => {
				return new Promise(resolve => {
					let image = new Image();
					image.onload = () => resolve(image);
					image.onerror = () => resolve(image);
					image.src = item;
				})
			});

			Promise.allSettled(promises).then(results => {
				options.dataSource = results
					.map(item => item.value)
					.filter(image => image)
					.map(image => {
						return {
							src:    image.src,
							width:  image.width,
							height: image.height
						}
					});

				const gallery = new PhotoSwipe(options);
				gallery.init();
			}).catch(e => {
				console.error(e);
			});
		},

		loadPickupPointsIfNeeded() {
			if (this.deliveryOptionsAvailable) {

				this.pickupPointItems = [];
				this.pickupPointsLoading = false;
				this.pickupPointsLoadingCount = 0;
				this.pickupPointsLoadingError = null;
				
				const options = this.deliveryOptions || {};

				if (options.selfPickup?.isEnabled) {
					const item = {
						isSelfPickup: true,
						hash: this.selfPickupItemId,
						address: this.item.address,
						additionalInfo: options.selfPickup?.additionalInfo,
						time: this.item.time,
						relay: this.item.relay,
						status: this.item.status,
						published: this.item.published,
						geohash: this.item.published,
					};
					this.pickupPointItems = [item];
				}

				if (options.pickupPoints?.isEnabled) {
					const ids = options.pickupPoints?.ids || [];

					this.pickupPointsLoading = true;
					this.pickupPointsLoadingCount = ids.length + this.pickupPointItems.length;
					this.pickupPointsLoadingError = null;
					
					this.sdk.getBrtOffersByHashes(ids).then(items => {
						this.pickupPointItems = this.pickupPointItems.concat(items);
					}).catch(e => {
						this.pickupPointsLoadingError = e;
						this.pickupPointItems = [];
						console.error(e);
					}).finally(() => {
						this.pickupPointsLoading = false;
						this.pickupPointsLoadingCount = 0;
					});
				}
			}
		},

		pickupPointsRepeatLoading() {
			this.loadPickupPointsIfNeeded();
		},

		selectPickupPoint(offer) {
			this.selectedOfferId = offer.hash;
		},

		unselectPickupPoint() {
			this.selectedOfferId = null;
		},

		selectedOfferIds() {
			return this.selectedOfferId ? [this.selectedOfferId] : [];
		},

		clearSelectedDeliveryOption() {
			const 
				hash = this.item?.hash,
				targetOffer = hash && this.sdk.barteron._offers[hash];
			
			if (targetOffer && targetOffer.selectedDeliveryOption) {
				delete targetOffer.selectedDeliveryOption;
			};
		}
	},

	mounted() {
		this.$2watch("item.address").then(() => {
			this.loadPickupPointsIfNeeded();
		});
	},

	watch: {
		selectedOfferId(newValue) {
			let option = null;
			if (newValue) {
				option = (newValue === this.selfPickupItemId) 
					? {selfPickup: true} 
					: {pickupPoint: this.pickupPointItems.filter(f => f.hash === newValue).pop()};
			};

			const 
				hash = this.item?.hash,
				targetOffer = hash && this.sdk.barteron._offers[hash];

			if (targetOffer) {
				targetOffer.selectedDeliveryOption = option;
			};
		}
	},

	beforeDestroy() {
		this.clearSelectedDeliveryOption();
	},
}