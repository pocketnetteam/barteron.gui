import i18n from "@/i18n/index.js";

export default {
	name: "ReferralDialog",

	i18n,

	data() {
		return {
			lightbox: false,
		}
	},

	computed: {
		referralProgramInfoURL() {
			return this.sdk.referralProgramInfoURL;
		}
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

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},

		openReferralProgramInfo() {
			this.sdk.openExternalLink(this.referralProgramInfoURL.link);
		},

		getReferralLink() {
			if (this.sdk.address) {
				const link = `https://bastyon.com/application?id=barteron.pocketnet.app&ref=${this.sdk.address}`;
				navigator.clipboard.writeText(link).then(() => {
					this.sdk.alertMessage(this.$t("referralLabels.referral_link_copy_success"));
				}).catch(e => {
					console.error(e);
					const message = this.$t("referralLabels.referral_link_copy_fail") + ` (${e.message})`;
					this.sdk.alertMessage(message);
				});
			} else {
				this.sdk.alertMessage("error: address is empty");
			};
		},
	},
}