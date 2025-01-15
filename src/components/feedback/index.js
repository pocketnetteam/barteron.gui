export default {
	name: "Feedback",

	data() {
		return {
			lightbox: false,
			loading: false
		}
	},

	computed: {
		form() {
			return this.$refs.form;
		}
	},

	methods: {
		/**
		 * Submit form
		 */
		submit() {
			this.loading = true;

			/* Show dialog */
			this.form.dialog.view("load", this.$t("feedbackLabels.submit_form"));

			setTimeout(() => {
				this.form.dialog.view(
					"success",
					{
						text: this.$t("feedbackLabels.submit_success"),
						buttons: [
							{
								text: this.$t("buttonLabels.ok"),
								vType: "roshi",
								vSize: "sm",
								click: () => {
									this.form.dialog.hide();
									this.loading = false;
									this.lightbox = false;
								}
							}
						]
					}
				)
			}, 3000);
		}
	}
}