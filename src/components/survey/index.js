import VueI18n from "@/i18n/index.js";

export default {
	name: "Survey",

	props: {
	},

	data() {
		return {
			lightbox: false,
			loading: false,
		}
	},

	computed: {
		form() {
			return this.$refs.form;
		},
	},

	methods: {
		localize(key) {
			return VueI18n.t(key);
		},

		show() {
			this.lightbox = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.lightbox = false;
			setTimeout(() => {
				this.$emit("onHide", this);
				this.remove();
			}, 300);
		},

		submit() {

			this.loading = true;

			/* Show dialog */
			this.form.dialog.view("load", this.localize("surveyLabels.submit_form"));

			setTimeout(() => {
				this.form.dialog.view(
					"success",
					{
						text: this.localize("surveyLabels.submit_success"),
						buttons: [
							{
								text: this.localize("buttonLabels.ok"),
								vType: "roshi",
								vSize: "sm",
								click: () => {
									this.form.dialog.hide();
									this.loading = false;
									this.$emit("onSubmit", this);
									this.hide();
								}
							}
						]
					}
				)
			}, 3000);
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		}
	},
}