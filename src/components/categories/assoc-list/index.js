export default {
	name: "AssocList",

	props: {
		items: {
			type: Array,
			default: () => []
		}
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
				return require(`@/assets/images/${ image }`)
			} catch {
				return false;
			}
		}
	}
}