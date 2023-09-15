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
			tags: []
		}
	},

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @return {String}
		 */
		address() {
			return this.sdk.address;
		},

		/**
		 * Barteron account
		 * 
		 * @return {Array}
		 */
		account() {
			return this.sdk.barteron.account[this.address];
		},

		/**
		 * Get my location
		 * 
		 * @return {Array}
		 */
		location() {
			const location = Object.values(this.sdk.location);
			return location.length ? location : undefined;
		},

		/**
		 * Make list of filters
		 * 
		 * @return {Array}
		 */
		filters() {
			return this.parseLabels("filterLabels");
		},

		/**
		 * Make list of view
		 * 
		 * @return {Array}
		 */
		views() {
			return this.parseLabels("viewLabels");
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
		 * Filter change callback
		 * 
		 * @param {Object} item 
		 */
		selectFilter(item) {
			console.log(item)
		},

		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			console.log(view)
		},

		/**
		 * Store what i want to get
		 * 
		 * @param {String} value
		 */
		saveGetting(value) {
			this.getting = value;
		},

		/**
		 * Store tags
		 * 
		 * @param {Array} tags
		 */
		saveTags(tags) {
			this.tags = tags;
		},

		calcPrice() {
			const
				values = { "usd": 0.25, "eur": 0.24, "pkoin": 1},
				currency = this.$refs.currency.selected,
				field = this.$refs.price,
				input = field.inputs[0],
				pkoin = field.inputs[1];

				pkoin.value = Math.ceil((input.value / values[currency.value]) * 100) / 100;
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				form = this.$refs.form,
				photos = this.$refs.photos,
				center = this.$refs.map.marker || this.$refs.map.center;

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
					images = photos.serialize();
				
				/* Show loader */
				form.popup.update({
					text: "Sending data, please wait..."
				}).show();

				/* Upload images to imgur through bastyon */
				this.sdk.uploadImagesToImgur(Object.values(images))
					.then(urls => {
						/* Send request to create an offer */
						this.sdk.setBrtOffer({
							language: this.$i18n.locale,
							caption: data.title,
							description: data.description,
							tag: data.category,
							tags: data.tags.split(","),
							images: urls,
							geohash: GeoHash.encodeGeoHash.apply(null, center),
							price: Number(data.price)
						}).then(() => {
							form.popup.hide();
						}).catch(err => {
							/* Show error popup */
							form.popup.update({
								text: `Offer error has occured ${ err }`,
								close: true,
								icon: false
							});
						});
					})
					.catch(err => {
						/* Show error popup */
						form.popup.update({
							text: `Image upload error ${ err }`,
							close: true,
							icon: false
						});
					});
			}
		}
	}
}