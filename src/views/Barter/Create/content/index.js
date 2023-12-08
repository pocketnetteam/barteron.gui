import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import Category from "@/components/categories/field/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

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

	computed: {
		/**
		 * Barteron account
		 * 
		 * @returns {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.sdk.address];
		},

		/**
		 * Get offer data (edit mode)
		 * 
		 * @returns {Object}
		 */
		offer() {
			let offer = this.sdk.barteron.offers[this.$route.params.id];

			if (!offer.hash) offer = new this.sdk.models.Offer(this.sdk);

			this.fillData(offer);

			return offer;
		},

		/**
		 * Get my location
		 * 
		 * @returns {Array|null}
		 */
		location() {
			const location = this.sdk.location;
			return location.latitude ? Object.values(location) : null; 
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
			const currencies = this.sdk.currency;

			return Object.keys(currencies).map(key => ({
				text: key,
				value: key.toLocaleLowerCase()
			}));
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
		parseLabels(label) {
			return Object.keys(this.$t(label)).map((value, index) => {
				return { text: this.$t(`${ label }.${ value }`), value, default: index === 0 };
			});
		},

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
				center = [
					"marker",
					"point",
					"center"
				].map(p => this.$refs.map[p]).filter(p => p).shift(),
				data = form.serialize(),
				images = photos.serialize();

			/* Fill offer data */
			this.offer.update({
				address: this.sdk.address,
				language: this.$i18n.locale,
				caption: data.title,
				description: data.description,
				tag: Number(data.category),
				tags: this.getting === "something" ? data.tags.split(",").map(tag => Number(tag)) : [this.getting],
				condition: this.condition,
				images: Object.values(images),
				geohash: GeoHash.encodeGeoHash.apply(null, center),
				price: Number(data.pkoin || 0)
			});

			return { hash, form, photos, center, data, images };
		},

		/**
		 * Preview an offer
		 */
		preview() {
			this.serializeForm();

			this.$router.push({
				name: "barterItem",
				params: { id: this.offer.hash },
				query: { preview: 1 }
			});
		},

		/**
		 * Submit form data
		 */
		submit() {
			const { hash, form, photos, images } = this.serializeForm();

			if (photos.validate()) {
				photos.$el.classList.add(form.classes.passed);
				photos.$el.classList.remove(form.classes.rejected);
			} else {
				photos.$el.classList.add(form.classes.rejected);
				photos.$el.classList.remove(form.classes.passed);
			}

			/* Check all fields validity */
			if (form.validate()) {
				const upload = Object.values(images).filter(image => image.startsWith("data:image"));
				
				/* Show dialog */
				form.dialog.view("load", this.$t("dialog.images_imgur"));

				/* Upload images to imgur through bastyon */
				this.sdk.uploadImagesToImgur(upload)
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
						form.dialog.view("load", this.$t("dialog.data_node"));

						/* Send request to create or update(hash) an offer */
						this.offer.set({
							hash,
							images: Object.values(images)
						}).then((data) => {
							if (data.transaction) {
								form.dialog.hide();
								this.$router.push({
									name: "exchangeOptions",
									params: {
										id: hash?.length < 64 ? data.transaction : hash
									}
								});
							}
						}).catch(e => {
							/* Show error dialog */
							const error = this.$t(
								`dialog.error#${ e?.toString()?.replace(/[^\d-]/g, '') || 0 }`,
								{ details: e }
							);

							form.dialog.view("error", this.$t('dialog.node_error', { error }));
						});
					})
					.catch(error => {
						/* Show error dialog */
						form.dialog.view("error", this.$t('dialog.image_error', { error }));
					});
			}
		}
	},

	beforeCreate() {
		/* Request for permissons */
		this.sdk.requestPermissions(["account"]);
	}
}