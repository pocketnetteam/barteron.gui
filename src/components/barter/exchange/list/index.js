export default {
	name: "ExchangeList",

	props: {
		tags: {
			type: Array,
			default: [
				"Electronics",
				"Dress",
				"Shoes",
				"Beauty & Health",
				"Sport & Recreation",
				"Computers",
				"Food",
				"Services",
				"Auto",
				"Party",
			]
		}
	},

	data() {
		return {
			show: 5
		}
	},

	methods: {
		/**
		 * Toggle items to see
		 */
		toggle() {
			if (this.show < this.tags.length) {
				this.show = this.tags.length;
			} else {
				this.show = 5;
			}
		}
	},
}