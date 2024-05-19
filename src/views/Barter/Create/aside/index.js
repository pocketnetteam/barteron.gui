export default {
	name: "Aside",

	data() {
		return {
			steps: this.parseLabels("stepsLabels")
		}
	},

	methods: {
		/**
		 * Get class for menuitem
		 * 
		 * @param {Boolean} step
		 */
		getClass(step) {
			if (step.hasOwnProperty("valid")) {
				return step.valid ? "passed" : "rejected";
			}

			return "";
		},

		/**
		 * Scroll content viewport to element
		 * 
		 * @param {String} selector
		 */
		scrollTo(selector) {
			this.$components.content.scrollTo(selector);
		},

		/**
		 * Set state for step
		 * 
		 * @param {String} id
		 * @param {Object} [flag]
		 * @param {Boolean} [flag.default]
		 * @param {Boolean} [flag.valid]
		 */
		setStep(id, flag) {
			const index = this.steps.findIndex(step => {
				return step.value === id;
			});

			if (index > -1) {
				this.$set(this.steps, index, { ...this.steps[index], ...flag });
			}
		}
	}
}