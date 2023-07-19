export default {
	name: "BarterExchange",

	props: {
		item: Object,
		items: []
	},

	data() {
		return {
			selected: 0,
			show: 3
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
		 * Toggle items to see
		 */
		toggle() {
			if (this.show < this.items.length) {
				this.show = this.items.length;
			} else {
				this.show = 3;
			}
		}
	}
}