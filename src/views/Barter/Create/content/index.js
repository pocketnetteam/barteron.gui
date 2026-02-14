import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import Category from "@/components/categories/field/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import WorkSchedule from "@/components/work-schedule/index.vue";
import PickupPointList from "@/components/pickup-point/list/index.vue";
import SafeDeal from "@/components/safe-deal/safe-deal-offer/index.vue";
import { currencies, numberFormats } from "@/i18n/index.js";
import CurrencyStore from "@/stores/currency.js";
import { GeoHashApproximator } from "@/js/geohashUtils.js";
import AppErrors from "@/js/appErrors.js";
import NotificationsBanner from "@/components/notifications-banner/index.vue";
import Vue from 'vue';
import {
	default as profileStore,
} from "@/stores/profile.js";

export default {
	name: "Content",

	components: {
		BarterList,
		Category,
		ExchangeList,
		WorkSchedule,
		PickupPointList,
		SafeDeal,
	},

	data() {
		return {
			sourceOffer: null,
			offer: {},
			offerPublished: false,

			pricePrefix: null,
			videoOrderVariant: "first",
			getting: "something",
			condition: "new",
			price: 0,
			pkoin: 0,
			tags: [],
			currencyRatesLoading: false,
			currencyRateError: false,
			currencyPrice: {},
			currencyPriceEnabled: false,

			pickupPointsEnabled: false,
			pickupPointItems: [],
			pickupPointsLoading: false,
			pickupPointsLoadingCount: 0,
			pickupPointsLoadingError: null,

			selfPickupEnabled: false,

			directDeliveryEnabled: false,
			
			pickupPointsRequestData: {
				pageSize: 100,
				pageStart: 0,
				topHeight: null,
				isLoading: false,
			},
			mapActionData: {},
		}
	},

	inject: ["dialog", "lightboxContainer"],

	computed: {
		pickupPoint() {
			return this.offer?.delivery?.pickupPoint;
		},

		deliveryOptions() {
			return this.offer?.delivery?.deliveryOptions;
		},

		mapHeight() {
			return this.isLargeScreen() ? "560px" : "400px";
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
		 * Safe deal option available
		 */
		safeDealAvailable() {
			let result = false;

			const 
				settings = this.sdk.getSafeDealSettings(),
				filter = settings.allowedAddressFilter;

			if (filter.isEnabled && !(filter.items.includes(this.sdk.address))) {
				result = false;
			} else {
				if (this.sdk.safeDealAvailable()) {
					result = true;
				};
			};

			return result;
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
				},
				".validator-fee-variants-box": {
					empty: true, /* Validate for emptity */
					regex: false, /* Validate with regex */
					prop: "validatedvalue", /* Check field prop */
					isCustomDataAttr: true,
				},
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
				currency = this.$refs.currency?.selected?.toUpperCase(),
				rate = values[currency];

			/* Handle pkoin input */
			if (reverse?.target?.name === "pkoin") {
				reverse = reverse.target.value;
			};

			if (rate && rate > 0) {
				if (price && !price?.value?.length) {
					price.value = 0;
				};

				if (reverse?.target || reverse?.value) {
					/* Typing in price field */
					this.price = parseFloat(price?.value || 0);
					this.pkoin = (this.price / rate).toFixed(2);
				} else {
					/* Get value from offer */
					this.pkoin = parseFloat(reverse || 0);
					this.price = (this.pkoin * rate).toFixed(2);
				}
			} else {
				this.currencyRateError = true;
			};
		},

		showCurrencyRateError() {
			const 
				currency = this.$refs.currency?.selected?.toUpperCase(),
				message = this.$t("dialogLabels.currency_rate_error_message", {currency});

			this.showWarning(message, () => {
					this.navigateToMainPage();
				}
			);
		},

		/**
		 * Fill fields from offer
		 * 
		 * @param {Object} offer
		 */
		fillDataAsync(offer) {
			this.$nextTick(() => {
				if (offer.hash?.length >= 64 || offer.hash === "draft") {
					this.fillMetaData(offer);
					this.fillVideoData(offer);
					this.fillTagsData(offer);
					this.fillConditionData(offer);
					this.fillPriceData(offer);
					this.fillDeliveryData(offer);
				} else {
					this.resetOfferFieldsToDefault();
				}
			});
		},

		fillMetaData(offer) {
			this.pricePrefix = offer.metaData?.price?.prefix;
		},

		fillVideoData(offer) {
			// videoSettings - deprecated, metaData.video will be used instead in the future
			this.videoOrderVariant = offer.videoSettings?.order || "first";
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
				&& !(currencyPriceData.isDisabled)
				&& (offer.hash === "draft" || currencyPriceData.exists);
			
			this.waitForRefs("currency,price").then(() => {
				if (currencyPriceData.exists) {
					this.price = this.currencyPrice.price;
					this.$refs.currency.setValue(currencyPriceData.listItem);
				} else if (offer.price) {
					this.pkoin = offer.price;
				};
			}).then(() => {
				this.currencyRatesLoading = true;
				return this.sdk.loadCurrencyRates();
			}).then(() => {
				this.currencyRatesLoading = false;
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
			this.directDeliveryEnabled = (deliveryOptions?.directDelivery?.isEnabled ? true : false);

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
			this.pricePrefix = null;
			this.videoOrderVariant = "first";
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

			this.directDeliveryEnabled = false;
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

		pricePrefixAvailable() {
			return this.sdk.offerMetaDataAvailable() && this.isCategoryForPricePrefix();
		},

		isCategoryForPricePrefix() {
			const 
				id = this.$refs.category?.id,
				topParent = id && this.categories.getParentsById(id)?.[0];

			return (id === 2 || topParent?.id === 2);
		},

		newVideoAdded() {
			this.offer.newVideoAdded = true;
		},

		changeVideoOrderVariant(value) {
			const options = [
				"first",
				"last",
			];

			const isValid = options.includes(value);
			if (isValid) {
				this.videoOrderVariant = value;
			};
		},

		pricePrefixValueChanged(value, e) {
			this.pricePrefix = e.target.checked ? "from" : null;
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

		directDeliveryEnabledStateChanged(value, e) {
			this.directDeliveryEnabled = e.target.checked;
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

				const checkingData = {
					requestSource: "offerCreation",
					requestId: Math.round(Math.random() * 1e+10),
					checkRequestId: true,
				};

				const ids = this.sdk.requestServiceData.ids;
				ids[checkingData.requestSource] = checkingData.requestId;
				
				const
					approximator = new GeoHashApproximator(actionParams.bounds),
					location = approximator.getGeohashItems();

				const request = {
					tags,
					location,
					pageSize,
					pageStart,
					topHeight, 
					checkingData,
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
						console.info(e.message);
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

		categoryHasChildren() {
			const id = this.$refs.category?.id;
			return this.categories.hasChildren(id);
		},

		categoryIsEmpty() {
			return !(this.$refs.category?.id);
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
				price = this.currencyPrice?.price,
				isDisabled = this.currencyPrice?.isDisabled;

			if (this.currencyPriceAvailable 
				&& !(isDisabled)
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
				isDisabled,
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
			} else if (!(this.currencyPriceEnabled)) {
				result = {
					isDisabled: true,
				};
			};

			return result;
		},

		serializeVideo() {
			let 
				url = "",
				videoSettings = {};

			if (this.sdk.videoOperationsAvailable()) {
				url = this.$refs.videoUploader?.getData()?.url || "";
				videoSettings = {
					order: this.videoOrderVariant || "first",
				};
			};

			return {
				videoSettings,
				video: url,
			};
		},

		serializeMetaData() {
			const 
				metaData = this.offer.metaData || {},
				prefix = this.isCategoryForPricePrefix() ? this.pricePrefix : null,
				price = prefix ? { prefix } : null;
			
			return {
				...metaData,
				...(price && { price }),
			};
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
					const deliveryOptionsExist = (this.pickupPointsEnabled || this.selfPickupEnabled || this.directDeliveryEnabled);
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
								directDelivery: {
									isEnabled: this.directDeliveryEnabled,
									additionalInfo: data.directDeliveryAdditionalInfo,
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
			let formMetaData = {};

			if (this.categoryHasChildren()) {
				formMetaData = {
					completed: false,
					message: this.$t("categoriesLabels.invalid_category_value"),
					field: this.$refs.category.$el,
				};
				return { formMetaData };
			};

			const 
				videoUploader = this.$refs.videoUploader, // optional
				videoCheckingResult = videoUploader?.canSerialize();

			if (videoCheckingResult && !(videoCheckingResult.canSerialize)) {
				formMetaData = {
					completed: false,
					message: videoCheckingResult.message,
					isWarning: videoCheckingResult.isWarning,
					field: videoUploader.$el,
				};
				return { formMetaData };
			};

			const
				hash = this.offer.hash,
				form = this.$refs.form,
				photos = this.$refs.photos,
				center = this.$refs.map["marker"],
				data = form.serialize(),
				images = photos.serialize(),
				serializedVideo = this.serializeVideo(),
				serializedMetaData = this.serializeMetaData(),
				delivery = this.serializeDelivery(data),
				workSchedule = this.$refs.workSchedule, // optional
				pickupPointList = this.$refs.pickupPointList, // optional
				safeDeal = this.$refs.safeDeal, // optional
				serializedSafeDeal = safeDeal?.serialize() || {},
				currencyPrice = this.serializeCurrencyPrice(),
				tags = this.getting === "something" 
					? (data.tags ? data.tags.split(",").map(tag => Number(tag)) : [])
					: [this.getting];

			/* Fill offer data */
			this.sourceOffer.update({
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
				video: serializedVideo.video,
				videoSettings: serializedVideo.videoSettings,
				metaData: serializedMetaData,
				delivery,
				safeDeal: serializedSafeDeal,
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

			formMetaData.completed = true;

			return { formMetaData, hash, form, photos, center, data, images, workSchedule, pickupPointList, safeDeal };
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
		 * @param {Boolean|undefined} scope.safeDealValid
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

							case "safe-deal": {
								return scope.safeDealValid;
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
			const to = this.$route.params.from 
				? { path: this.$route.params.from } 
				: { name: "home" };
			
			this.$router.push(to).catch(e => {
				console.error(e);
				this.showVersionConflictIfNeeded(e);
			});
		},

		/**
		 * Preview an offer
		 */
		preview() {
			const data = this.serializeForm();

			if (data.formMetaData?.completed) {
				this.$router.push({
					name: "barterItem",
					params: { id: this.offer.hash, from: this.$route.params.from },
					query: { preview: 1 }
				}).catch(e => {
					console.error(e);
					this.showVersionConflictIfNeeded(e);
				});
			} else {
				const { message, isWarning, field } = data.formMetaData;
				field && this.scrollTo(field);
				message && (isWarning ? this.showWarning(message) : this.showError(message));
			};
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
				serializationData = this.serializeForm(),
				serializationFormMetaData = serializationData.formMetaData;

			if (serializationFormMetaData && !(serializationFormMetaData?.completed)) {
				const { message, isWarning, field } = serializationFormMetaData;
				field && this.scrollTo(field);
				message && (isWarning ? this.showWarning(message) : this.showError(message));
				return;
			};

			const
				{ hash, form, photos, images, workSchedule, pickupPointList, safeDeal } = serializationData,
				formValid = form.validate(),
				photosValid = photos.validate(),
				workScheduleValid = workSchedule?.validate(),
				pickupPointListValid = pickupPointList?.validate(),
				safeDealValid = safeDeal?.validate();

			/* Set steps validity at aside */
			this.stepState({
				form,
				formValid,
				photosValid,
				workScheduleValid,
				pickupPointListValid,
				safeDealValid,
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
						this.sourceOffer.set({
							hash,
							images: Object.values(images),
							published: "published"
						}).then((data) => {
							if (data.transaction) {
								this.offer.newVideoAdded = false;
								this.offerPublished = true;
								form.dialog.hide();
								const offerHash = hash?.length < 64 ? data.transaction : hash;
								this.performActionsAfterPublishing(form, offerHash);
							} else {
								const 
									code = data.error?.code ?? (typeof(data.rejected) === "number" ? data.rejected : undefined),
									error = this.sdk.errorMessage(code);

								console.error(error);
								form.dialog.view("error", this.$t("dialogLabels.node_error", { error }));
							}
						}).catch(e => {
							const error = this.sdk.errorMessage(e);
							console.error(error);
							form.dialog.view("error", this.$t("dialogLabels.node_error", { error }));
						});
					})
					.catch(error => {
						console.error(error);
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

		performActionsAfterPublishing(form, offerHash) {
			this.$router.push({
				name: "exchangeOptions",
				params: {
					id: offerHash
				}
			}).catch(error => {
				console.error(error);

				const
					options = { prefix: this.$t("barterLabels.offer_has_been_published") },
					warningShown = this.showVersionConflictIfNeeded(
						error, 
						options
					);

				if (!(warningShown)) {
					form.dialog.view("info", options.prefix);
				};

				return { wasError: true };

			}).then((result) => {
				const needShow = !(result?.wasError || profileStore.notificationsBannerDisabled);
				if (needShow) {
					this.showNotificationsBanner();
				}
			}).catch(error => {
				this.showError(error);
			});
		},

		showNotificationsBanner() {
			const ComponentClass = Vue.extend(NotificationsBanner);
			const instance = new ComponentClass({
				propsData: {
					viewMode: "banner",
					offerHasBeenPublished: true,
				},
			});
			
			instance.$on('onHide', vm => {});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
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

		loadOffer() {
			Promise.resolve().then(() => {
				const
					id = this.$route.params.id,
					cached = this.sdk.barteron._offers[id],
					loaded = cached?.address;
				
				if (cached && loaded) {
					return cached;
				} else if (!(id) || id === "draft") {
					return new this.sdk.models.Offer();
				} else if (id?.length >= 64) {					
					return this.sdk.getBrtOffersByHashes([id]).then(items => {
						const offer = items[0];
						if (!(offer)) {
							throw new Error(`Failed to load offer, hash: ${id})`);
						};
						return offer;
					});
				} else {
					throw new Error(`Internal error: unknown type of $route.params.id = ${id}`);
				};
			}).then(offer => {
				this.sourceOffer = offer;
				const offerCopy = {...offer};
				this.offer = offerCopy;
				this.fillDataAsync(offerCopy);
			}).catch(e => {
				this.showError(e);
			})
		},
	},

	watch: {
		currencyRateError(value) {
			if (value) {
				this.showCurrencyRateError();
			};
		},
	},

	beforeCreate() {
		/* Request for permissons */
		this.sdk.requestPermissions(["account"]);
	},

	mounted() {
		this.loadOffer();
	},

	updated() {
		this.updateAsideStepsAsync();
	},

	beforeRouteLeave (to, from, next) {
		const
			isPreviewRoute = (to?.name === "barterItem" && to?.query?.preview),
			videoData = this.$refs.videoUploader?.getData(),
			unpublishedVideo = (videoData?.videoExists && this.offer.newVideoAdded);

		if (isPreviewRoute) {
			next();
		} else if (unpublishedVideo) {
			const dialog = this.dialog?.instance;
			dialog.view("question", this.$t("dialogLabels.need_remove_unpublished_video")).then(state => {
				if (state) {
					this.$refs.videoUploader?.videoRemoving({disableStateChange: true}).then(() => {
						this.offer.newVideoAdded = false;
						next();
					}).catch(e => {
						next(false);
						this.showError(e);
					});
				} else {
					next(false);
				};
			});
		} else {
			next();
		};
	}	
}