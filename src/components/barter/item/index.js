export default {
	name: "BarterItem",

	props: {
		item: Object
	},

	data() {
		return {
			hover: 0
		}
	},

	methods: {
		/**
		 * Get absolute path from relative
		 * 
		 * @param {String} relative 
		 * @returns {String}
		 */
		imageUrl(relative) {
			try {
				return require(`@/assets/images/barter/${ relative }`)
			} catch {
				return false;
			}
		},

		/**
		 * Decode text special chars
		 * 
		 * @param {String} html
		 * @return {String}
		 */
		decodeString(html) {
			const text = document.createElement("textarea");
			text.innerHTML = html;
			return text.value;
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
			return ids.map(id => this.$t(this.categories.items[id]?.name))
				.filter(m => m).join(", ");
		},

		/**
		 * Calculate item distance to you
		 */
		calcDistance() {

		},

		/**
		 * Make bullet and their image at hover state
		 * 
		 * @param {Number} index 
		 */
		hoverize(index) {
			this.hover = index;
		}
	}
}