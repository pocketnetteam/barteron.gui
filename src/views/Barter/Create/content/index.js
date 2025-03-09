import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import Category from "@/components/categories/field/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import WorkSchedule from "@/components/work-schedule/index.vue";
import Delivery from "@/components/delivery/index.vue";
import { currencies, numberFormats } from "@/i18n/index.js";
import CurrencyStore from "@/stores/currency.js";
import { GeohashBoundsHelper, GeoHashApproximator } from "@/js/geohashUtils.js";

export default {
	name: "Content",

	components: {
		BarterList,
		Category,
		ExchangeList,
		WorkSchedule,
		Delivery
	},

	data() {
		return {
			getting: "something",
			condition: "new",
			price: 0,
			pkoin: 0,
			tags: [],
			currencyPrice: {},
			currencyPriceEnabled: false,
			pickupPointsEnabled: false,
			selfPickupEnabled: false,
			pickupPointsRequestData: {
				pageSize: 100,
				pageStart: 0,
				topHeight: null,
				isLoading: false,
			},
			mapActionData: {},
			deliveryPoints: []
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get offer data (edit mode)
		 * 
		 * @returns {@Offer}
		 */
		offer() {
			let offer = this.sdk.barteron.offers[this.$route.params.id];

			if (!offer.hash) offer = new this.sdk.models.Offer();

			this.fillData(offer);

			return offer;
		},

		pickupPoint() {
			return this.offer?.delivery?.pickupPoint;
		},

		deliveryOptions() {
			return this.offer?.delivery?.deliveryOptions;
		},

		/**
		 * Get my location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			return this.sdk.ifEmpty(this.sdk.location, undefined);
		},

		/**
		 * Decode offer geohash
		 * 
		 * @returns {Array|null}
		 */
		geohash() {
			if (this.offer.geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(this.offer.geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
		},

		/**
		 * Currency price option available
		 */
		currencyPriceAvailable() {
			return (this.sdk.getTransactionsApiVersion() >= 2);
		},

		/**
		 * Delivery option available
		 */
		deliveryAvailable() {
			return (this.sdk.getTransactionsApiVersion() >= 3);
		},

		/**
		 * Format currencies to list
		 */
		currencies() {
			return currencies.sort(this.$root.$i18n.locale).map(currency => ({
				text: currency.code,
				value: currency.code,
				selected: currency.code === (CurrencyStore.currency || numberFormats[this.$root.$i18n.locale]?.currency.currency)
			}));
		},

		validationRules() {
			return {
				"input[name], textarea[name]": {
					empty: true, /* Validate for emptity */
					regex: false, /* Validate with regex */
					prop: "value" /* Check field prop */
				},
				"#work-schedule-day-list": {
					empty: true, /* Validate for emptity */
					regex: false, /* Validate with regex */
					prop: "validatedvalue", /* Check field prop */
					isCustomDataAttr: true,
				}
			}
		},
	},

	methods: {
		mapHeight() {
			let result = undefined;
			const value = getComputedStyle(document.documentElement).getPropertyValue('--device-size-large');
			if (value) {
				const 
					query = `screen and (max-width: ${value})`,
					exceedsInputSize = !(window.matchMedia(query).matches);
				
				if (exceedsInputSize) {
					result = "560px"
				}
			}
			return result;
		},

		/**
		 * Convert price from currency to pkoin
		 * 
		 * @param {Object|Event|Number} reverse - from pkoin to currency
		 */
		calcPrice(reverse) {
			const
				values = this.sdk.currency,
				price = this.$refs.price?.inputs?.[0],
				currency = this.$refs.currency?.selected?.toUpperCase();

			/* Handle pkoin input */
			if (reverse?.target?.name === "pkoin") {
				reverse = reverse.target.value;
			};

			if (!this.sdk.empty(values)) {
				if (price && !price?.value?.length) {
					price.value = 0;
				};

				if (reverse?.target || reverse?.value) {
					/* Typing in price field */
					this.price = parseFloat(price?.value || 0);
					this.pkoin = (this.price / values[currency]).toFixed(2);
				} else {
					/* Get value from offer */
					this.pkoin = parseFloat(reverse || 0);
					this.price = (this.pkoin * values[currency]).toFixed(2);
				}
			}
		},

		/**
		 * Fill fields from offer
		 * 
		 * @param {Object} offer
		 */
		fillData(offer) {
			this.$nextTick(() => {
				if (offer.hash?.length >= 64 || offer.hash === "draft") {
					if (offer.tags) {
						if (["my_list", "for_nothing"].includes(offer.tags[0])) {
							this.tags = [];
							this.getting = offer.tags[0];
						} else {
							this.getting = "something";
							this.tags = offer.tags;
						}
					}

					if (offer.condition) this.condition = offer.condition;

					const deliveryOptions = this.deliveryAvailable && offer.delivery?.deliveryOptions;
					this.pickupPointsEnabled = (deliveryOptions?.pickupPoints?.isEnabled ? true : false);
					this.selfPickupEnabled = (deliveryOptions?.selfPickup?.isEnabled ? true : false);
				
					this.currencyPrice = offer.currencyPrice || {};
					
					const currencyPriceData = this.getCurrencyPriceData();

					this.currencyPriceEnabled = this.currencyPriceAvailable 
						&& (offer.hash === "draft" || currencyPriceData.exists);
					
					this.waitForRefs("currency,price").then(() => {
						if (currencyPriceData.exists) {
							this.price = this.currencyPrice.price;
							this.$refs.currency.setValue(currencyPriceData.listItem);
						} else if (offer.price) {
							this.pkoin = offer.price;
						};
					}).then(() => {
						/* Wait for currency rates */
						return this.sdk.currency;
					}).then(() => {
						if (currencyPriceData.exists) {
							this.calcPrice({value: currencyPriceData.currency});
						} else if (offer.price) {
							this.calcPrice(offer.price);
						};
					}).catch(e => { 
						console.error(e);
					});
				} else {
					/* Reset fields to default */
					this.tags = [];
					this.getting = "something";
					this.condition = "new";
					this.price = this.pkoin = 0;
					this.currencyPrice = {};
					this.currencyPriceEnabled = this.currencyPriceAvailable;
					this.pickupPointsEnabled = false;
					this.selfPickupEnabled = false;
				}
			});
		},

		isPickupPointCategory() {
			return (this.$refs.category?.id === 97);
		},

		priceHintLabel() {
			const
				state = this.currencyPriceEnabled ? "enabled" : "disabled",
				key = `currency_price_${state}_hint`,
				currency = this.$refs.currency?.selected?.toUpperCase();

			return this.$t(key, { currency });
		},

		currencyPriceLabel() {
			const currency = this.$refs.currency?.selected?.toUpperCase();
			return this.$t("currency_price_text", { currency });
		},

		currencyPriceEnabledStateChanged(value, e) {
			this.currencyPriceEnabled = e.target.checked;
		},

		pickupPointsEnabledStateChanged(value, e) {
			this.pickupPointsEnabled = e.target.checked;
		},

		selfPickupEnabledStateChanged(value, e) {
			this.selfPickupEnabled = e.target.checked;
		},

		mapAction(actionName, actionParams, event) {

			this.pickupPointsRequestData.actionName = actionName;

			if (actionName === "loadData" || actionName === "loadNextPage") {

				const 
					tags = [97],
					pageStart = (actionName === "loadNextPage") ? (this.pickupPointsRequestData.pageStart + 1) : 0,
					topHeight = (actionName === "loadNextPage") ? this.pickupPointsRequestData.topHeight : null,
					pageSize = this.pickupPointsRequestData.pageSize;

				const ids = this.sdk.requestServiceData.ids;
				ids.getBrtOffersFeed += 1;

				const
					approximator = new GeoHashApproximator(actionParams.bounds),
					location = approximator.getGeohashItems();

				const request = {
					tags,
					location,
					pageSize,
					pageStart,
					topHeight, 
					checkingData: {
						requestId: ids.getBrtOffersFeed,
						checkRequestId: true,
					}
				}

				this.pickupPointsRequestData.isLoading = true;

				this.setMapActionData();

				this.sdk.getBrtOffersFeed(
					request
				).then(offers => {
					if (pageStart === 0) {
						this.pickupPointsRequestData.topHeight = offers?.[0]?.height;
					}
					this.pickupPointsRequestData.pageStart = pageStart;
					this.pickupPointsRequestData.isLoading = false;
					this.setMapActionData(offers);
				}).catch(e => { 
					const
						requestRejected = (e instanceof AppErrors.RequestIdError),
						needHandleError = !(requestRejected);

					if (needHandleError) {
						console.error(e);
						this.pickupPointsRequestData.isLoading = false;
						this.setMapActionData(null, e);
					} else {
						console.info(`Location component, map action ${actionName}:`, e.message);
					}
				});				
			} else if (actionName === "moveMap") {
				this.pickupPointsRequestData.isLoading = false;
				this.setMapActionData();
			}

		},

		setMapActionData(offers, error) {
			this.mapActionData = {
				actionName: this.pickupPointsRequestData.actionName,
				isLoading: this.pickupPointsRequestData.isLoading,
				nextPageExists: (offers?.length === this.pickupPointsRequestData.pageSize),
				isNextPage: (offers?.length && this.pickupPointsRequestData.pageStart > 0),
				offers,
				error
			}
		},		

		getCurrencyPriceData() {
			let exists = false;
			let listItem = null;

			const
				currency = this.currencyPrice?.currency?.toUpperCase(),
				price = this.currencyPrice?.price;

			if (this.currencyPriceAvailable 
				&& currency 
				&& (typeof price === "number") 
				&& price >= 0
			) {
				listItem = this.currencies.filter(f => f.value?.toUpperCase() === currency).pop();
				exists = !!(listItem);
			};

			return {
				exists,
				listItem,
				currency,
			};
		},

		serializeCurrencyPrice() {
			let result = {};

			const
				currency = this.$refs.currency?.selected?.toUpperCase(),
				price = this.price,
				isValid = (currency && price >= 0);
			
			if (this.currencyPriceEnabled && isValid) {
				result = {
					currency,
					price,
				};
			};

			return result;
		},

		serializeDelivery(data) {
			let result = {};

			if (this.deliveryAvailable && data) {

				const isPickupPointOffer = this.isPickupPointCategory();
				if (isPickupPointOffer) {
					result = {
						pickupPoint: {
							financialTerms: data.financialTerms,
							workSchedule: this.$refs.workSchedule.serialize(),
							address: (data.address || "").length > 200 ? data.address.slice(0, 200) : data.address,
							route: data.route,
						},
					};
				} else if (!(isPickupPointOffer)) {
					const deliveryOptionsExist = (this.pickupPointsEnabled || this.selfPickupEnabled);
					if (deliveryOptionsExist) {
						result = {
							deliveryOptions: {
								pickupPoints: {
									isEnabled: this.pickupPointsEnabled,
								},
								selfPickup: {
									isEnabled: this.selfPickupEnabled,
									additionalInfo: data.selfPickupAdditionalInfo,
								},
							},
						};
					}
				}
			}

			return result;
		},

		/**
		 * Get near delivery points
		 */
		getDeliveryPoints(latlng) {
			this.deliveryPoints = [];
			return;

			const
				sideLengthInKm = 100,
				boundsHelper = new GeohashBoundsHelper(latlng, sideLengthInKm),
				approximator = new GeoHashApproximator(boundsHelper.getBounds()),
				location = approximator.getGeohashItems();

			this.sdk.getBrtOffersFeed({
				tags: [97],
				location,
				pageSize: 200
			}).then(feed => {
				this.deliveryPoints = feed;
			});
		},

		/**
		 * Create new offer model and fill data
		 */
		serializeForm() {
			const
				hash = this.offer.hash,
				form = this.$refs.form,
				photos = this.$refs.photos,
				center = this.$refs.map["marker"],
				data = form.serialize(),
				images = photos.serialize(),
				delivery = this.serializeDelivery(data),
				currencyPrice = this.serializeCurrencyPrice(),
				tags = this.getting === "something" 
					? (data.tags ? data.tags.split(",").map(tag => Number(tag)) : [])
					: [this.getting];

			/* Fill offer data */
			this.offer.update({
				address: this.sdk.address,
				language: this.$i18n.locale,
				caption: data.title,
				description: data.description,
				tag: Number(data.category || 99),
				tags: tags,
				condition: this.condition,
				images: Object.values(images),
				geohash: GeoHash.encodeGeoHash.apply(null, center),
				currencyPrice,
				delivery,
				price: Number(data.pkoin || 0)
			});

			/* Add/remove passed/rejected classes to photos uploader */
			if (photos.validate()) {
				photos.$el.classList.add(form.classes.passed);
				photos.$el.classList.remove(form.classes.rejected);
			} else {
				photos.$el.classList.add(form.classes.rejected);
				photos.$el.classList.remove(form.classes.passed);
			}

			return { hash, form, photos, center, data, images };
		},

		/**
		 * Set steps state at aside
		 * 
		 * @param {Object} scope
		 * @param {Object} scope.form
		 * @param {Boolean} scope.formValid
		 * @param {Boolean} scope.photosValid
		 */
		stepState(scope) {
			this.$components.aside.steps.forEach(step => {
				const
					getField = (cb) => {
						return scope.form.valid[
							scope.form.valid.findIndex(index => cb(index.field))
						];
					},

					getValid = () => {
						switch (step.value) {
							case "photos": {
								return scope.photosValid;
							}

							case "get": {
								return getField(f => f.name === "tags")?.valid;
							}

							case "location": {
								return true;
							}

							default: {
								return getField(f => f.id === step.value)?.valid;
							}
						}
					};

				this.$components.aside.setStep(step.value, { valid: getValid() });
			});
		},

		/**
		 * Cancel an offer
		 */
		cancel() {
			if (this.$route.params.from) {
				this.$router.push({ path: this.$route.params.from });
			} else {
				this.$router.push({ name: "home" });
			}
		},

		/**
		 * Preview an offer
		 */
		preview() {
			this.serializeForm();

			this.$router.push({
				name: "barterItem",
				params: { id: this.offer.hash, from: this.$route.params.from },
				query: { preview: 1 }
			});
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				{ hash, form, photos, images } = this.serializeForm(),
				formValid = form.validate(),
				photosValid = photos.validate();

			/* Set steps validity at aside */
			this.stepState({
				form,
				formValid,
				photosValid
			});

			/* Check all fields validity */
			if (formValid && photosValid) {
				const upload = Object.values(images).filter(image => image.startsWith("data:image"));
				
				/* Show dialog */
				form.dialog.view("load", this.$t("dialogLabels.images_imgur"));

				/* Upload images to imgur through bastyon */
				this.sdk.uploadImagesToImgur({
					images: upload,
					resize: 1024/* ,
					watermark: {
						image: Watermark,
						opacity: .5,
						bottom: 10,
						right: 10
					} */
				}, true)
					.then(urls => {
						/* Replace data:image with given urls */
						if (urls?.length) {
							for (let i in images) {
								if (images[i].startsWith("http")) continue;

								const index = upload.findIndex(image => image === images[i]);
								if (index > -1) images[i] = urls[index];
							}

						}

						/* Show dialog */
						form.dialog.view("load", this.$t("dialogLabels.data_node"));

						/* Send request to create or update(hash) an offer */
						this.offer.set({
							hash,
							images: Object.values(images),
							published: "published"
						}).then((data) => {
							if (data.transaction) {
								form.dialog.hide();
								this.$router.push({
									name: "exchangeOptions",
									params: {
										id: hash?.length < 64 ? data.transaction : hash
									}
								});
							} else {
								const error = this.sdk.errorMessage(data.error?.code);
								form.dialog.view("error", this.$t("dialogLabels.node_error", { error }));
							}
						}).catch(e => {
							/* Show error dialog */
							const error = this.sdk.errorMessage(e);
							form.dialog.view("error", this.$t("dialogLabels.node_error", { error }));
						});
					})
					.catch(error => {
						/* Show error dialog */
						form.dialog.view("error", this.$t("dialogLabels.image_error", { error: error.message }));
					});
			} else {
				/* Scroll view to first rejected input */
				const field = (() => {
					if (!formValid) {
						const input = form.valid.filter(f => !f.valid)[0].field;

						if (input.name === "tags" && !photosValid) {
							/* Scroll to photos section if tags is invalid */
							return this.$refs.photos.$el;
						} else if (input.type === "hidden") {
							/* Scroll to input parent if rejected is hidden */
							return input.parentNode;
						}

						return input;
					} else {
						return this.$refs.photos.$el;
					};
				})();

				field && this.scrollTo(field);
			}
		},

		/**
		 * Scroll view to element
		 * 
		 * @param {HTMLElement} target
		 */
		scrollTo(target) {
			this.scrollToElement(target, { block: "center" });
		},

		/**
		 * Show error from the map
		 * 
		 * @param {Error} error
		 */
		errorEvent(error) {
			this.showError(error);
		},
	},

	beforeCreate() {
		/* Request for permissons */
		this.sdk.requestPermissions(["account"]);
	}
}