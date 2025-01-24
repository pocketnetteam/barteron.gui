export default {
	name: "Delivery",

	props: {
		entries: {
			type: Array,
			default: () => []
		},
		type: {
			type: String,
			default: "radio" /* radio/checkbox */
		}
	},

	data() {
		return {
			about: false,
			entry: null
		}
	},

	computed: {
		/**
		 * Get v-switch instance
		 * 
		 * @returns {Object}
		 */
		switch() {
			return this.$refs.switch;
		}
	},

	methods: {
		/**
		 * Serialize fields
		 * 
		 * @method serialize
		 * @returns {Array}
		 */
		serialize() {
			return this.switch.serialize();
		},

		/**
		 * Show about this point
		 * 
		 * @method showAbout
		 * @param {Object} entry
		 */
		showAbout(entry) {
			this.entry = entry;
			this.about = true;
		},

		/**
		 * Hide about this point
		 * 
		 * @method hideAbout
		 */
		hideAbout() {
			this.about = false;
		}
	}
}