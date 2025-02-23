import i18n from "@/i18n/index.js";

export default {
	name: "Survey",

	i18n,

	data() {
		return {
			lightbox: false,
			loading: false,
			answersFailed: false,
			rules: {},
			emailAllowed: false,
		}
	},

	computed: {
		minLengthToShowEmail() {
			return 100;
		},
	},

	methods: {
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

		textareaContentChanged() {
			const
				content1 = (this.$refs.answer1?.content || ""),
				content2 = (this.$refs.answer2?.content || "");

			this.emailAllowed = (content1 + content2).length >= this.minLengthToShowEmail;
		},

		getRules() {
			const 
				data = this.$refs.form?.serialize(),
				regex = (this.emailAllowed && data?.email) 
					? /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ 
					: false;

			return {
				"input[name=email]": {
					empty: false,
					regex,
					prop: "value"
				},
				"textarea[name=answer1], textarea[name=answer2]": {
					empty: !(data?.answer1 || data?.answer2),
					regex: false,
					prop: "value"
				},
			};
		},

		submit() {
			this.rules = this.getRules();
			this.$refs.answer1.trimContent();
			this.$refs.answer2.trimContent();

			this.$nextTick(() => {
				const
					data = this.$refs.form.serialize(),
					validated = this.$refs.form.validate();

				this.answersFailed = !(data.answer1 || data.answer2);

				if (validated && !this.answersFailed) {
					this.sendData();
				};
			});
		},

		sendData() {
			this.$refs.form.dialog.view("load", this.$t("dialogLabels.survey_form"));

			const data = this.$refs.form.serialize();

			this.loading = true;
			this.sdk.setSurveyData(data).then(() => {
				this.showSuccessDialog();
			}).catch(e => {
				const error = this.sdk.errorMessage(e);
				this.$refs.form.dialog.view("error", this.$t("dialogLabels.survey_error", { error }));
			}).finally(() => {
				this.loading = false;
			});
		},

		showSuccessDialog() {
			this.$refs.form.dialog.view(
				"success", this.$t("dialogLabels.survey_success")
			).then(() => {
				this.$emit("onSubmit", this);
				this.$refs.form.dialog.hide();
				this.hide();
			})
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		}
	},
}