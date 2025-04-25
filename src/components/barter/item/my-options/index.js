export default {
	name: "MyOptions",

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
	},

	computed: {
		/**
		 * Getting preview flag
		 * 
		 * @returns {Boolean}
		 */
		isPreview() {
			return this.$route.query.preview;
		},

		/**
		 * Check if offer exists
		 * 
		 * @returns {Boolean}
		 */
		offerExists() {
			return (this.item?.hash?.length >= 64);
		},
	},

	methods: {
		withdrawOffer(e) {
			this.$emit("withdrawOffer", e);
		},

		renewOffer(e) {
			this.$emit("renewOffer", e);
		},

		removeOffer(e) {
			this.$emit("removeOffer", e);
		}
	}
}