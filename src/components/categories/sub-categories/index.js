export default {
	name: "SubCategories",

	props: {
		items: {
			type: Array,
			default: () => []
		}
	},
	
	methods: {
		/**
		 * Get localization text
		 * 
		 * @param {String} text 
		 * @return {String}
		 */
		text(text) {
			return this.$te(text) ? this.$t(text) : text;
		}
	}
}