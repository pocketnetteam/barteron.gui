export default {
	name: "BarterExchange",

	props: {
		item: Object,
		items: []
	},

	data() {
		return {
			selected: 0,
			show: 3,
			groupExchange: []
		}
	},

	methods: {
		/**
		 * Get absolute path from path
		 * 
		 * @param {String} path
		 * 
		 * @returns {String}
		 */
		imageUrl(path) {
			if (["http", "data:image"].some(str => path?.startsWith(str))) {
				return path;
			} else {
				try {
					return require(`@/assets/images/barter/${ path }`)
				} catch {
					return null;
				}
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
		},

		proposeExchange() {
			this.$emit("propose", this.items[this.selected]);
		}
	},

	async mounted() {
		this.groupExchange = await this.sdk.getBrtOfferDeals({
			offer: this.item.hash,
			address: this.sdk.address
		});
	}
}