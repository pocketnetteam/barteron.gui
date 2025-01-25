import PointPreview from "../barter/item/details/index.vue";

export default {
	name: "Delivery",

	components: {
		PointPreview
	},

	props: {
		entries: {
			type: Array,
			default: () => []
		},
		offerHash: {
			type: String,
			default: ""
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
		 * Get selected point
		 * 
		 * @param {String} e
		 * 
		 * @returns {Object}
		 */
		getSelectedPoint(e) {
			this.entry = this.entries.filter(f => f.hash === e)?.[0];

			if (this.offerHash) {
				this.sdk.barteron._offers[this.offerHash].selectedPoint = this.entry;
			}
			
			return this.entry;
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