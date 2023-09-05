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
			tags: []
		}
	},

	computed: {
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
		 * Store tags
		 * 
		 * @param {Array} tags
		 */
		saveTags(tags) {
			this.tags = tags;
		},

		/**
		 * Submit form data
		 */
		submit() {
			const
				form = this.$refs.form,
				photos = this.$refs.photos;

			/* If all fields valid */
			if (form.validate()) {
				const 
					data = form.serialize(),
					images = photos.serialize();
				
				/* Upload images to imgur through bastyon */
				/* this.sdk.uploadImagesToImgur(Object.values(images)).then(urls => {
					console.log(urls)
				}) */
				form.popup.update({
					text: "Sending data, please wait..."
				}).show()

				console.log(data, images)
			}
		}
	}
}