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