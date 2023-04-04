export default {
	name: "BarterItem",

	inject: ["categoriesMap"],

	props: {
		item: Object
	},

	methods: {
		/**
		 * Get image from assets
		 * 
		 * @param {String} image 
		 * @returns {URL}
		 */
		imageUrl(image) {
			try {
				return require(`../../../assets/images/barter/${ image }`)
			} catch {
				return false;
			}
		},

		/**
		 * Format price to given currency
		 * 
		 * @param {Object} param0
		 * @param {Number} param0.value
		 * @param {String} [param0.locale]
		 * @return {String}
		 */
		formatCurrency({ value, locale }) {
			return (value).toLocaleString(locale ?? "en-US");
		},

		/**
		 * Get categories list from id's array
		 * 
		 * @param {Array} ids
		 * @return {String}
		 */
		getCategories(ids) {
			return ids.map(id => this.categoriesMap[id]).join(", ");
		},

		/**
		 * Calculate item distance to you
		 */
		calcDistance() {

		}
	}
}