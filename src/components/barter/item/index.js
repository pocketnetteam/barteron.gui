import ImageLoad from "@/components/image-load/index.vue";
import Loader from "@/components/loader/index.vue";
import VideoPreview from "@/components/video-preview/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import WorkSchedule from "@/components/work-schedule/index.vue";
import CurrencySwitcher from "@/components/currency-switcher/index.vue";
import Caption from "@/components/barter/item/caption/index.vue";
import Price from "@/components/barter/item/price/index.vue";
import LinkifiedText from "@/components/linkified-text/index.vue";
import BoostInfo from "@/components/barter/item/boost-info/index.vue";
import PickupPointList from "@/components/pickup-point/list/index.vue";
import MyOptions from "@/components/barter/item/my-options/index.vue";
import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import Complain from "@/components/barter/item/complain/index.vue";
import LegalInfo from "@/components/legal-info/index.vue";
import LikeStore from "@/stores/like.js";
import SelectOfferDialog from "@/views/Barter/SelectOfferDialog/index.vue";
import SelectDealTypeDialog from "@/components/safe-deal/select-deal-type-dialog/index.vue";
import SelectValidatorDialog from "@/components/safe-deal/select-validator-dialog/index.vue";
import SafeDeal from "@/components/safe-deal/safe-deal-offer/index.vue";
import Score from "@/components/score/index.vue";
import { showMediaItems } from "@/js/mediaUtils.js";
import SafeDealUtils from "@/js/safeDealUtils.js";
import "photoswipe/style.css";
import Vue from 'vue';

export default {
	name: "BarterItem",

	components: {
		ImageLoad,
		Loader,
		VideoPreview,
		ExchangeList,
		WorkSchedule,
		Caption,
		Price,
		LinkifiedText,
		BoostInfo,
		PickupPointList,
		MyOptions,
		BarterExchange,
		Profile,
		Complain,
		CurrencySwitcher,
		SafeDeal,
		LegalInfo,
		SelectOfferDialog,
		Score,
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
			videoItem: null,
			hover: 0,
			active: 0,
			addr: {},
			myOffers: [],

            exchangeAvailable: false,
            purchaseState: "startPurchase",
            isChatLoading: false,

			pickupPointItems: [],
			pickupPointsLoading: false,
			pickupPointsLoadingCount: 0,
			pickupPointsLoadingError: null,

			selectedOfferId: null,
		}
	},

	inject: ["dialog", 'lightboxContainer'],

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
			return this.pricePrefixFrom ? (this.$t("priceLabels.from") + " ") : "";
		},

		pricePrefixFrom() {
			return this.pickupPoint || this.item.metaData?.price?.prefix === "from";
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

		pickupPointsExist() {
			const options = this.deliveryOptions || {};
			return options.pickupPoints?.isEnabled;
		},

		selfPickupItemId() {
			return "self_pickup";
		},

		purchaseStateLabel() {
			const result = {
				isEnabled: false,
				iconClass: "",
				i18nKey: ""
			};
			
			if (this.purchaseState === "waitForPickupPoint") {
				result.isEnabled = true;
				result.iconClass = "fa fa-chevron-circle-up";
				result.i18nKey = "deliveryLabels.hint_for_delivery_option_selection";
			} else if (this.purchaseState === "pickupPointSelected") {
				result.isEnabled = true;
				result.iconClass = "fa fa-info-circle";
				result.i18nKey = "deliveryLabels.hint_for_purchase_at_pickup_point";
			};

			return result;
		},

		/**
		 * Get map mode
		 * 
		 * @returns {String}
		 */
		mapMode() {
			return this.deliveryOptionsAvailable ? "deliverySelection" : "view";
		},

		mapWidth() {
			return (this.pickupPointsExist) ? undefined : "400px";
		},

		mapHeight() {
			return (this.pickupPointsExist && this.isLargeScreen()) ? "560px" : "400px";
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
			if (!this.addr?.display_name) {
				if (!this.addr.fetching && this.geohash) {
					this.addr.fetching = true;
				
					this.sdk.geoLocation(this.geohash, {
						"zoom": this.zoom || 18,
						"accept-language": this.sdk.getLanguageByLocale(this.$root.$i18n.locale)
					}).then(result => {
						if (result?.display_name) this.$set(this, "addr", result);
					}).catch(e => { 
						console.error(e);
					}).finally(() => {
						this.addr.fetching = false;
					});
				}

				return null;
			} else {
				let result = this.addr?.display_name || "";
				const 
					countryCode = this.addr?.address?.country_code,
					needReverse = ["ru", "ua", "by"].includes(countryCode);

				if (needReverse) {
					result = result
						.split(",")
						.map(m => m.trim())
						.reverse()
						.join(", ");
				}
				return result;
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

		offerAvailable() {
			return !(this.hasRelay || this.isRemoved);
		},

		/**
		 * Customize offer link
		 * 
		 * @returns {Object|String}
		 */
		offerLink() {
			if (!(this.offerAvailable)) {
				return {};
			} else if (!this.customLink) {
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

		mediaItems() {
			const imageItems = (this.images || []).map(m => ({
				url: m,
				type: "image",
			}));

			let result = imageItems;

			this.setVideoItem();

			if (this.videoItem) {
				const order = this.item.videoSettings?.order;
				if (order === "last") {
					result = [...imageItems, this.videoItem];
				} else {
					result = [this.videoItem, ...imageItems];
				};
			};

			return result;
		},

		averageOfferScore() {
			return this.sdk.barteron.averageOfferScores[this.item.hash];
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
		},

		requiredLegalInfoItemKeys() {
			return ["barter_agreement_draft"];
		},

		legalInfoAvailable() {
			const
				locale = this.$root.$i18n.locale,
				data = LegalInfo.methods.allDocumentsWithoutContext?.() || {},
				existingKeys = (data[locale] || []).map(m => m.i18nKey);

			return this.requiredLegalInfoItemKeys.some(f => existingKeys.includes(f));
		},
	},

	methods: {
		mapOffers() {
			let result = [];
			if (this.mapMode === "deliverySelection") {
				const
					selfPickupExists = this.pickupPointItems.some(f => f.isSelfPickup),
					shouldReplaceThisOfferWithSelfPickupItem = selfPickupExists;

				result = shouldReplaceThisOfferWithSelfPickupItem ? [...this.pickupPointItems] : [this.item, ...this.pickupPointItems];
			} else {
				result = [this.item];
			};
			return result;
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
		 * 
		 * @param {Object} options
		 */
		shareItem(options = { shareOnBastyon: false }) {
			if (!(this.hasRelay || this.isRemoved)) {
				const data = {
					hash: this.item.hash,
					caption: this.item.caption,
					images: this.images,
				};
				this.sdk.share(data, options);
			}
		},

		shareItemOnBastyonIsAvailable() {
			return this.sdk.shareOnBastyonIsAvailable();
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

		setVideoItem() {
			if (this.sdk.videoOperationsAvailable() && !(this.videoItem)) {
				const url = this.item.video;
				if (url) {
					Vue.set(this, "videoItem", {
						url: url,
						type: "video",
						data: null,
						error: null,
					});

					this.sdk.getVideoInfo([url]).then(dataItems => {
						const videoItem = dataItems?.[0];
						if (videoItem) {
							Vue.set(this.videoItem, "data", videoItem);
						} else {
							throw new Error(this.$t("videosLabels.video_not_found_or_removed"));
						};
					}).catch(e => {
						Vue.set(this.videoItem, "error", e);
						console.error(e);
					});
				};
			};
		},

		/**
		 * Click on media item
		 * 
		 * @param {Number} index
		 */
		mediaItemClick(index) {
			showMediaItems(this.mediaItems, index);
		},

		/**
		 * Select your offer to propose exchange seller's offer
		 */
		selectOfferToExchange() {
			var ComponentClass = Vue.extend(SelectOfferDialog);
			var instance = new ComponentClass({
				propsData: {
					item: this.item,
					items: this.myOffers,
				}
			});
			
			instance.$on('onSelect', vm => {
				const targetOffer = this.myOffers[vm.selected];
				this.createRoom(targetOffer, {isExchange: true});
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			instance.show();
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
						caption: this.$t("deliveryLabels.self_pickup"),
						additionalInfo: options.selfPickup?.additionalInfo,
						time: this.item.time,
						relay: this.item.relay,
						status: this.item.status,
						published: this.item.published,
						geohash: this.item.geohash,
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

		selectPickupPoint(offer, options) {
			this.selectedOfferId = offer.hash;
			if (options?.source === "map") {
				offer.hash && this.$refs.pickupPointList?.scrollToItem(offer.hash);
			} else if (options?.source === "list") {
				offer.geohash && this.$refs.map?.moveToGeohash(offer.geohash);
			}
		},

		buyAtPickupPoint(offer, options) {
			if (this.selectedOfferId !== offer.hash) {
				this.selectedOfferId = offer.hash;
			};
			this.buyAtSelectedPickupPoint();
		},

		selectedOfferIds() {
			return this.selectedOfferId ? [this.selectedOfferId] : [];
		},

		safeDealAvailableForOffer() {
			let result = true;
			const 
				settings = this.sdk.getSafeDealSettings(),
				filter = settings.allowedAddressFilter;

			if (filter.isEnabled && !(filter.items.includes(this.sdk.address))) {
				result = false;
			}; 
			
			if (result && this.deliveryOptionsAvailable) {
				const 
					options = this.deliveryOptions,
					onlyPickupPoints = (
						options.pickupPoints?.isEnabled 
						&& !(options.selfPickup?.isEnabled)
					);

				if (onlyPickupPoints) {
					result = false;
				}
			}
			return result;
		},

		/**
		 * Start purchase
		 */
		startPurchase() {
			if (this.sdk.willOpenRegistration()) return;

			let 
				isPurchase = true,
				pickupPoint = null;

			if (this.deliveryOptionsAvailable) {
				pickupPoint = this.getSelectedPickupPoint();
				if (!(pickupPoint)) {
					this.purchaseState = "waitForPickupPoint";
					this.goToPickupPointList();
					return;
				}
			};

			Promise.resolve().then(() => {

				const needSelectDealType = this.safeDealAvailableForOffer() && (!(pickupPoint) || pickupPoint?.isSelfPickup);
				return needSelectDealType ? this.selectDealTypePromise() : "regularDeal";

			}).then(dealType => {

				if (dealType === "regularDeal") {
					this.createRoom(
						this.item, 
						{isPurchase, pickupPoint}
					);
				} else if (dealType === "safeDeal") {
					return this.selectValidatorPromise();
				};

			}).then(validator => {

				if (validator) {
					this.createRoom(
						this.item, 
						{isPurchase, validator, pickupPoint}
					);
				}

			}).catch(e => {
				this.showError(e);
			});
		},

		selectDealTypePromise() {
			return new Promise(resolve => {
				const ComponentClass = Vue.extend(SelectDealTypeDialog);
				const instance = new ComponentClass({
					propsData: {
						lightboxContainer: this.lightboxContainer,
					},
				});
				
				instance.$on('onSelect', (dealType) => {
					resolve(dealType);
				});
				instance.$on('onHide', () => {
					resolve();
				});

				instance.$mount();
				this.lightboxContainer().appendChild(instance.$el);
				this.$nextTick(() => {
					instance.show();
				});
			});
		},

		selectValidatorPromise(options = {}) {
			return new Promise(resolve => {
				const ComponentClass = Vue.extend(SelectValidatorDialog);
				const instance = new ComponentClass({
					propsData: {
						excludedAddresses: [this.item.address, this.sdk.address],
						forcedSelectedAddress: options?.forcedSelectedAddress,
					},
				});
				
				instance.$on('onSelect', (validator) => {
					resolve(validator);
				});
				instance.$on('onHide', () => {
					resolve();
				});

				instance.$mount();
				this.lightboxContainer().appendChild(instance.$el);
				this.$nextTick(() => {
					instance.show();
				});
			});
		},

		waitForPickupPoint() {
			this.goToPickupPointList();
			if (this.purchaseState === "waitForPickupPoint") {
				this.$refs.pickupPointList?.animateSelection();
			}
		},

		/**
		 * Go to pickup point list
		 */
		goToPickupPointList() {
			this.scrollToElement("#pickup-point-list", { block: "center" });
		},

		/**
		 * Buy at selected pickup point
		 */
		buyAtSelectedPickupPoint() {
			this.startPurchase();
		},

		getSelectedPickupPoint() {
			return this.deliveryOptionsAvailable 
				? (this.selectedOfferId && this.pickupPointItems.find(f => f.hash === this.selectedOfferId))
				: null;
		},

		/**
		 * Create room and send message
		 * 
		 * @param {Offer} offer
		 * @param {Object} options
		 */
		createRoom(offer, options = {}) {
			if (this.sdk.willOpenRegistration()) return;

			let needCreateRoom = true;

			const data = {
				name: offer.caption,
				members: [this.address],
				messages: [this.sdk.appLink(`barter/${ offer.hash }`)],
				openRoom: true,
			};

			if (options?.isPurchase && (options?.validator || options?.pickupPoint)) {
				const 
					pickupPoint = options?.pickupPoint,
					validator = options?.validator;

				if (pickupPoint) {
					if (pickupPoint.isSelfPickup) {
						data.messages.push(this.$t("deliveryLabels.chat_message_self_pickup_selected"));
					} else if (pickupPoint.hash) {
						const 
							address = pickupPoint.address,
							hash = pickupPoint.hash;
						
						if (address && hash) {
							if (!(data.members.includes(address))) {
								data.members.push(address);
							}
							data.messages.push(this.sdk.appLink(`barter/${ hash }`));
							data.messages.push(this.$t("deliveryLabels.chat_message_pickup_point_selected"));
						}
					} else {
						needCreateRoom = false;
						const error = new Error(`Internal error: pickupPoint id must be defined`);
						this.showError(error);
					}
				};

				if (validator) {
					const 
						address = validator.address,
						feePercent = validator.settings?.feePercent;

					if (address && feePercent) {
						if (!(data.members.includes(address))) {
							data.members.push(address);
						};
						data.messages.push(this.$t("safeDealLabels.chat_message_purchase_option"));

						const idCreationData = {
							offer: offer.hash,
							buyer: this.sdk.address,
							validator: address,
							fee: feePercent,
						};

						let safeDealId = null;
						try {
							const idHelper = new SafeDealUtils.IdHelper();
							safeDealId = idHelper.createId(idCreationData);
						} catch (e) {
							this.showError(e);
							return;
						};
						
						const params = {
							id: safeDealId,
							...idCreationData,
						};
						const paramsString = new URLSearchParams(params).toString();

						data.messages.push(this.sdk.appLink(`barter/safedeal?${ paramsString }`));
					} else {
						const error = new Error("Internal error: address or feePercent not defined");
						this.showError(error);
						return;
					}
				};

			} else if (options?.isExchange && this.item?.hash) {
				data.messages.push(this.sdk.appLink(`barter/${ this.item?.hash }`));
				data.messages.push(this.$t("deliveryLabels.chat_message_exchange_proposed"));
			}
			
			if (needCreateRoom) {
				this.isChatLoading = true;
				this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
				this.sendMessage(data).then(() => {
					this.dialog?.instance.hide();
				}).catch(e => {
					this.showError(e);
				}).finally(() => {
					this.isChatLoading = false;
				});
			}
		},

		/**
		 * Show error from the map
		 * 
		 * @param {Error} error
		 */
		mapErrorEvent(error) {
			this.showError(error);
		},
	},

	mounted() {
		if (this.vType === "page") {
			this.$2watch("item.address").then(() => {
				this.loadPickupPointsIfNeeded();
			});
	
			const 
				needCheckExchangeAvailability = !(this.isMyOffer),
				needRequestMyOffers = needCheckExchangeAvailability;

			if (needRequestMyOffers) {
				this.sdk.getBrtOffers().then(items => {
					this.myOffers = items;
				}).catch(e => {
					console.error(e);
				});
			};
		};
	},

	watch: {
		myOffers() {
			this.exchangeAvailable = (this.myOffers?.length > 0);
		},

		selectedOfferId(newValue) {
			this.purchaseState = (newValue ? "pickupPointSelected" : "waitForPickupPoint");
		},
	},
}