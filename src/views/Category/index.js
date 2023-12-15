export default {
	name: "Category",

	computed: {
		/**
		 * Get category id from url
		 * 
		 * @returns {String}
		 */
		category() {
			return this.$route.params.id
		},

		/**
		 * Set breadcrumbs type
		 * 
		 * @returns {String}
		 */
		type() {
			return Number.isInteger(+this.category) ? "category" : "custom";
		}
	}
}