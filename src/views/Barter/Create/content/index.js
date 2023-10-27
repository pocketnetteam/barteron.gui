import { GeoHash } from "geohash";
import BarterList from "@/components/barter/list/index.vue";
import CategoriesSelect from "@/components/categories/multiple-select/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Content",

	components: {
		BarterList,
		CategoriesSelect,
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
		 * @return {Object}
		 */
		account() {
			return this.sdk.barteron.accounts[this.sdk.address];
		},

		/**
		 * Get offer data (edit mode)
		 * 
		 * @return {Object}
		 */
		offer() {
			let offer = this.sdk.barteron.offers[this.$route.params.id];

			if (!offer.hash) offer = new this.sdk.models.Offer(this.sdk, { hash: "draft" });

			this.fillData(offer);

			return offer;
		},

		/**
		 * Get my location
		 * 
		 * @return {Array|null}
		 */
		location() {
			const location = this.sdk.location;
			return location.latitude ? Object.values(location) : null; 
		},

		/**
		 * Decode offer geohash
		 * 
		 * @return {Array|null}
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
		 * @return {Array}
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
				price = this.$refs.price.$refs.fields[0],
				currency = this.$refs.currency?.selected?.toUpperCase();

				if (Object.keys(values).length) {
					if (reverse?.target) {
						/* Typing in price field */
						this.price = parseInt(price.value);
						this.pkoin = Math.ceil(((this.price / values[currency]) * 100) / 100);
					} else {
						/* Get value from offer */
						this.pkoin = parseInt(reverse);
						this.price = Math.ceil(((this.pkoin * values[currency]) * 100) / 100);
					}
				}
		},

		/**
		 * Fill fields from offer
		 * 
		 * @param {Object} offer
		 */
		fillData(offer) {
			setTimeout(() => {
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
	
					if (offer.images && this.$refs.photos) this.$refs.photos.remove().add(offer.images);
					if (offer.tag && this.$refs.category) this.$refs.category.remove().value(offer.tag);
					if (offer.price && this.$refs.price) this.calcPrice(offer.price);
				} else {
					/* Reset fields to default */
					this.tags = [];
					this.getting = "something";
					this.condition = "new";
	
					if (this.$refs.photos) this.$refs.photos.remove();
					if (this.$refs.category) this.$refs.category.remove();
					if (this.$refs.price) this.calcPrice(0);
				}
			}, 10);
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
				tag: data.category,
				tags: this.getting === "something" ? data.tags.split(",") : [this.getting],
				condition: this.condition,
				images: Object.values(images),
				geohash: GeoHash.encodeGeoHash.apply(null, center),
				price: Number(data.price || 1)
			});

			return { hash, form, photos, center, data, images };
		},

		/**
		 * Preview an offer
		 */
		preview() {
			this.serializeForm();

			console.log(this.$i18n)
			this.$router.push({ name: "barterItem", params: { id: this.offer.hash } });
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
								if (this.offer.hash?.length < 64) {
									this.offer.destroy();
								}

								form.dialog.hide();
								this.$router.push({ name: "addedBarter", params: { id: data.transaction } });
							}
						}).catch(error => {
							/* Show error dialog */
							const errNum = error?.toString().replace(/\D/g, '');
							form.dialog.view("error", this.$t('dialog.offer_error', {
								error: this.$t(`dialog.error#${ errNum }`)
							}));
						});
					})
					.catch(error => {
						console.log(this.sdk, err)
						/* Show error dialog */
						form.dialog.view("error", this.$t('dialog.image_error', { error }));
					});
			}
		}
	}
}