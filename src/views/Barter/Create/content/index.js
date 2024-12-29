import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import Category from "@/components/categories/field/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";
import { currencies, numberFormats } from "@/i18n/index.js";
import CurrencyStore from "@/stores/currency.js";

export default {
	name: "Content",

	components: {
		BarterList,
		Category,
		ExchangeList
	},

	data() {
		return {
			getting: "something",
			condition: "new",
			price: 0,
			pkoin: 0,
			tags: []
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
		 * Format currencies to list
		 */
		currencies() {
			return currencies.sort(this.$root.$i18n.locale).map(currency => ({
				text: currency.code,
				value: currency.code,
				selected: currency.code === (CurrencyStore.currency || numberFormats[this.$root.$i18n.locale]?.currency.currency)
			}));
		}
	},

	methods: {
		/**
		 * Convert price from currency to pkoin
		 * 
		 * @param {Number} reverse - from pkoin to currency
		 */
		calcPrice(reverse) {
			const
				values = this.sdk.currency,
				price = this.$refs.price?.inputs?.[0],
				currency = this.$refs.currency?.selected?.toUpperCase();

			/* Handle pkoin input */
			if (reverse?.target?.name === "pkoin") reverse = reverse.target.value;

			if (!this.sdk.empty(values)) {
				if (price && !price?.value?.length) price.value = 0;
				if (reverse?.target || reverse?.value) {
					/* Typing in price field */
					this.price = parseFloat(price?.value || 0);
					this.pkoin = (((this.price / values[currency]) * 100) / 100).toFixed(2);
				} else {
					/* Get value from offer */
					this.pkoin = parseFloat(reverse || 0);
					this.price = (((this.pkoin * values[currency]) * 100) / 100).toFixed(2);
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
	
					if (offer.price) {
						this.pkoin = offer.price;

						/* Await for currencies list */
						clearInterval(this.awaitCurrency);
						this.awaitCurrency = setInterval(() => {
							if (!this.sdk.empty(this.sdk.currency)) {
								clearInterval(this.awaitCurrency);
								delete this.awaitCurrency;

								this.calcPrice(offer.price);
							}
						});
					}
				} else {
					/* Reset fields to default */
					this.tags = [];
					this.getting = "something";
					this.condition = "new";
					this.price = this.pkoin = 0;
				}
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
				tags = this.getting === "something" ? data.tags.split(",").map(tag => Number(tag)) : [this.getting];

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
				})
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
						form.dialog.view("error", this.$t("dialogLabels.image_error", { error }));
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
					}
				})();

				this.scrollTo(field);
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