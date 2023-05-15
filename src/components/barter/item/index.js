export default {
	name: "BarterItem",

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		vType: {
			/* row, tile or item */
			type: String,
			default: "tile"
		}
	},

	data() {
		return {
			hover: 0,
			active: 0
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
			return ids.map(id => Object.assign(
				this.categories.items[id],
				{ title: this.$t(this.categories.items[id]?.name) }
			));
		},

		/**
		 * Calculate item distance to you
		 */
		calcDistance() {

		}
	}
}