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
			tags: []
		}
	},

	computed: {
		/**
		 * Barteron account
		 * 
		 * @return {Array}
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
			const offer = this.sdk.barteron.offers[this.$route.params.id];

			if (offer) this.fillData(offer);

			return offer;
		},

		/**
		 * Get my location
		 * 
		 * @return {Array}
		 */
		location() {
			const location = this.sdk.location;
			return location.latitude ? Object.values(location) : undefined; 
		},

		/**
		 * Decode offer geohash
		 * 
		 * @return {Array}
		 */
		geohash() {
			if (this.offer.geohash) {
				const { latitude, longitude } = GeoHash.decodeGeoHash(this.offer.geohash);
				return [latitude[0], longitude[0]];
			} else {
				return null;
			}
		}
	},

	methods: {
		/**
		 * Parse labels object from localization
		 * 
		 * @param {String} label 
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
				values = { "usd": 0.25, "eur": 0.24, "pkoin": 1},
				currency = this.$refs.currency.selected,
				field = this.$refs.price,
				input = field.inputs[0],
				pkoin = field.inputs[1];

				if (!Number.isInteger(reverse)) {
					pkoin.value = Math.ceil((input.value / values[currency.value]) * 100) / 100;
				} else {
					pkoin.value = reverse;
					input.value = Math.ceil((reverse * values[currency.value]) * 100) / 100;
				}
		},

		/**
		 * Fill fields from offer
		 * 
		 * @param {Object} offer
		 */
		fillData(offer) {
			setTimeout(() => {
				if (offer.hash) {
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
	
					if (offer.caption && this.$refs.caption?.inputs) this.$refs.caption.inputs[0].value = offer.caption;
					if (offer.images && this.$refs.photos) this.$refs.photos.remove().add(offer.images);
					if (offer.tag && this.$refs.category) this.$refs.category.remove().value(offer.tag);
					if (offer.price && this.$refs.price) this.calcPrice(offer.price);
					if (offer.description && this.$refs.description) this.$refs.description.content = offer.description;
				} else {
					/* Reset fields to default */
					this.tags = [];
					this.getting = "something";
					this.condition = "new";
	
					if (this.$refs.caption?.inputs) this.$refs.caption.inputs[0].value = "";
					if (this.$refs.photos) this.$refs.photos.remove();
					if (this.$refs.category) this.$refs.category.remove();
					if (this.$refs.price) this.calcPrice(0);
					if (this.$refs.description) this.$refs.description.content = "";
				}
			}, 10);
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				form = this.$refs.form,
				photos = this.$refs.photos,
				center = [
					"marker",
					"point",
					"center"
				].map(p => this.$refs.map[p]).filter(p => p).shift(),
				hash = this.offer.hash;

			if (photos.validate()) {
				photos.$el.classList.add(form.classes.passed);
				photos.$el.classList.remove(form.classes.rejected);
			} else {
				photos.$el.classList.add(form.classes.rejected);
				photos.$el.classList.remove(form.classes.passed);
			}

			/* Check all fields validity */
			if (form.validate()) {
				const 
					data = form.serialize(),
					images = photos.serialize(),
					upload = Object.values(images).filter(image => image.startsWith("data:image"));
				
				/* Show loader */
				form.popup.update({
					text: "Sending data, please wait..."
				}).show();

				/* Upload images to imgur through bastyon */
				this.sdk.uploadImagesToImgur(upload)
					.then(urls => {
						/* Merge images with urls */
						if (urls?.length) {
							for (let i in images) {
								if (images[i].startsWith("http")) continue;

								const index = upload.findIndex(image => image === images[i]);
								if (index > -1) images[i] = urls[index];
							}
						}

						/* Send request to create or update(hash) an offer */
						this.sdk.setBrtOffer({
							...(hash && { hash }),
							language: this.$i18n.locale,
							caption: data.title,
							description: data.description,
							tag: data.category,
							tags: this.getting === "something" ? data.tags.split(",") : [this.getting],
							condition: this.condition,
							images: Object.values(images),
							geohash: GeoHash.encodeGeoHash.apply(null, center),
							price: Number(data.price || 1)
						}).then(() => {
							form.popup.hide();
						}).catch(err => {
							/* Show error popup */
							form.popup.update({
								text: `Offer error has occured: ${ err }`,
								close: true,
								icon: false
							});
						});
					})
					.catch(err => {
						console.log(this.sdk)
						/* Show error popup */
						form.popup.update({
							text: `Image upload error: ${ err }`,
							close: true,
							icon: false
						});
					});
			}
		}
	}
}