import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import Category from "@/components/categories/field/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import WorkSchedule from "@/components/work-schedule/index.vue";
import PickupPointList from "@/components/pickup-point/list/index.vue";
import { currencies, numberFormats } from "@/i18n/index.js";
import CurrencyStore from "@/stores/currency.js";
import { GeoHashApproximator } from "@/js/geohashUtils.js";

export default {
	name: "Content",

	components: {
		BarterList,
		Category,
		ExchangeList,
		WorkSchedule,
		PickupPointList,
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
			pickupPointItems: [],
			pickupPointsLoading: false,
			pickupPointsLoadingCount: 0,
			pickupPointsLoadingError: null,

			selfPickupEnabled: false,
			
			pickupPointsRequestData: {
				pageSize: 100,
				pageStart: 0,
				topHeight: null,
				isLoading: false,
			},
			mapActionData: {},
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
				},
				".pickup-point-empty-list": {
					empty: true, /* Validate for emptity */
					regex: false, /* Validate with regex */
					prop: "validatedvalue", /* Check field prop */
					isCustomDataAttr: true,
				}
			}
		},
	},

	methods: {
		mapMode() {
			return (this.deliveryAvailable && !(this.isPickupPointCategory()) && this.pickupPointsEnabled) ? "deliveryInput" : "input";
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
					this.fillTagsData(offer);
					this.fillConditionData(offer);
					this.fillPriceData(offer);
					this.fillDeliveryData(offer);
				} else {
					this.resetOfferFieldsToDefault();
				}
			});
		},

		fillTagsData(offer) {
			if (offer.tags) {
				if (["my_list", "for_nothing"].includes(offer.tags[0])) {
					this.tags = [];
					this.getting = offer.tags[0];
				} else {
					this.getting = "something";
					this.tags = offer.tags;
				}
			};
		},

		fillConditionData(offer) {
			if (offer.condition) {
				this.condition = offer.condition;
			};
		},

		fillPriceData(offer) {
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
		},

		fillDeliveryData(offer) {
			const deliveryOptions = this.getDeliveryOptions(offer);
			this.pickupPointsEnabled = (deliveryOptions?.pickupPoints?.isEnabled ? true : false);
			this.selfPickupEnabled = (deliveryOptions?.selfPickup?.isEnabled ? true : false);

			if (this.pickupPointsEnabled) {
				const ids = deliveryOptions?.pickupPoints?.ids || [];
				this.loadPickupPoints(ids);
			};
		},

		getDeliveryOptions(offer) {
			return this.deliveryAvailable && offer.delivery?.deliveryOptions;
		},

		loadPickupPoints(ids) {
			this.pickupPointItems = [];
			this.pickupPointsLoading = true;
			this.pickupPointsLoadingCount = ids.length;
			this.pickupPointsLoadingError = null;
			
			this.sdk.getBrtOffersByHashes(ids).then(items => {
				this.pickupPointItems = items;
			}).catch(e => {
				this.pickupPointsLoadingError = e;
				this.pickupPointItems = [];
				console.error(e);
			}).finally(() => {
				this.pickupPointsLoading = false;
				this.pickupPointsLoadingCount = 0;
			});
		},

		resetOfferFieldsToDefault() {
			this.tags = [];
			this.getting = "something";
			this.condition = "new";
			this.price = this.pkoin = 0;
			
			this.currencyPrice = {};
			this.currencyPriceEnabled = this.currencyPriceAvailable;
			
			this.pickupPointsEnabled = false;
			this.pickupPointItems = [];
			this.pickupPointsLoading = false;
			this.pickupPointsLoadingCount = 0;
			this.pickupPointsLoadingError = null;
			
			this.selfPickupEnabled = false;
		},

		pickupPointsRepeatLoading() {
			const offer = this.offer;
			const deliveryOptions = this.getDeliveryOptions(offer);
			const ids = deliveryOptions?.pickupPoints?.ids || [];
			this.loadPickupPoints(ids);
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

		selectPickupPoint(offer) {
			const added = this.pickupPointItems.some(f => f.hash === offer.hash);
			if (!(added) && offer.hash?.length >= 64) {
				this.pickupPointItems.push(offer);
			};
		},

		unselectPickupPoint(offer) {
			const index = this.pickupPointItems.findIndex(f => f.hash === offer.hash);
			if (index >= 0) {
				this.pickupPointItems.splice(index, 1);
			}
		},

		selectedOfferIds() {
			return this.pickupPointItems
				.filter(f => (f.hash?.length >= 64))
				.map(item => item.hash);
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
					const filteredOffers = this.filterPickupPointsIfNeeded(offers);
					this.setMapActionData(filteredOffers);
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

		filterPickupPointsIfNeeded(offers) {
			let result = offers;
	
			const 
				settings = this.sdk.getDeliverySettings(),
				addressFilter = settings?.addressFilter;

			if (addressFilter?.isEnabled) {
				result = (offers || []).filter(f => f?.address && addressFilter?.items?.includes(f.address));
			};
	
			return result;
		},

		offerCreationParams() {
			let
				isAllowed = true,
				blockingMessage = null;

			if (this.isPickupPointCategory()) {
				const 
					settings = this.sdk.getDeliverySettings(),
					addressFilter = settings?.addressFilter;

				if (addressFilter?.isEnabled) {
					isAllowed = addressFilter?.items?.includes(this.sdk.address);
					if (!(isAllowed)) {
						blockingMessage = this.$t("deliveryLabels.pickup_point_creation_is_forbidden");
					};
				}
			};

			return {
				isAllowed,
				blockingMessage,
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
									ids: this.selectedOfferIds(),
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
				workSchedule = this.$refs.workSchedule, // optional
				pickupPointList = this.$refs.pickupPointList, // optional
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

			return { hash, form, photos, center, data, images, workSchedule, pickupPointList };
		},

		updateAsideStepsAsync() {
			this.$nextTick(() => {
				const 
					items = this.$components.aside.steps,
					newItems = this.parseLabels("stepsLabels").filter(f => document.getElementById(f.value)),
					values = items.map(m => m.value),
					newValues = newItems.map(m => m.value),
					needUpdate = (JSON.stringify(values) !== JSON.stringify(newValues));
				
				if (needUpdate) {
					this.$components.aside.steps = newItems;
				}
			});
		},

		/**
		 * Set steps state at aside
		 * 
		 * @param {Object} scope
		 * @param {Object} scope.form
		 * @param {Boolean} scope.formValid
		 * @param {Boolean} scope.photosValid
		 * @param {Boolean|undefined} scope.workScheduleValid
		 * @param {Boolean|undefined} scope.pickupPointListValid
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

							case "work-schedule": {
								return scope.workScheduleValid;
							}

							case "pickup-point-list": {
								return scope.pickupPointListValid;
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
			const params = this.offerCreationParams();
			if (!(params.isAllowed)) {
				const error = new Error(params.blockingMessage);
				this.showError(error);
				return;
			};

			const
				{ hash, form, photos, images, workSchedule, pickupPointList } = this.serializeForm(),
				formValid = form.validate(),
				photosValid = photos.validate(),
				workScheduleValid = workSchedule?.validate(),
				pickupPointListValid = pickupPointList?.validate();

			/* Set steps validity at aside */
			this.stepState({
				form,
				formValid,
				photosValid,
				workScheduleValid,
				pickupPointListValid,
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
		mapErrorEvent(error) {
			this.showError(error);
		},
	},

	beforeCreate() {
		/* Request for permissons */
		this.sdk.requestPermissions(["account"]);
	},

	mounted() {
		this.updateAsideStepsAsync();
	},

	updated() {
		this.updateAsideStepsAsync();
	}
}