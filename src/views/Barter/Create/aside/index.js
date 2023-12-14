export default {
	name: "Aside",

	computed: {
		/**
		 * Get list of sections
		 * 
		 * @returns {Object}
		 */
		steps() {
			return this.parseLabels("stepsLabels");
		}
	}
}