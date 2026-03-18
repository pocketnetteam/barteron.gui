import LegalInfo from "@/components/legal-info/index.vue";

export default {
	name: "StickerSlide",

	components: {
		LegalInfo,
	},

	props: {
		itemId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
		}
	},

	computed: {
		item() {
			let result = {};

			const iconOpacity = 0.0275;

			switch (this.itemId) {
				case "notifications":
					result = {
						backgroundColor: "#FFFAD2",
						icon: "fa-bell",
						iconOpacity,
						title: this.$t("notificationSettingsLabels.label"),
						description: this.$t("stickerLabels.notifications_description"),
						action: {
							icon: "⚙️",
							title: this.$t("stickerLabels.notifications_action"),
						},
					};
					break;

				case "safeDeal":
					result = {
						backgroundColor: "#DCFFC9",
						icon: "fa-shield-alt",
						iconOpacity,
						title: this.$t("safeDealLabels.label"),
						description: this.$t("stickerLabels.safe_deal_description"),
						action: {
							icon: "👉",
							title: this.$t("stickerLabels.safe_deal_action"),
						},
					};
					break;

				case "advice":
					result = {
						backgroundColor: "#D2F0FF",
						icon: "fa-lightbulb",
						iconOpacity,
						title: this.$t("stickerLabels.advice_title"),
						description: this.$t("stickerLabels.advice_description"),
						action: {
							icon: "✅",
							title: this.$t("stickerLabels.advice_action"),
						},
					};
					break;

				case "legalInfo":
					result = {
						backgroundColor: "#FFECDF",
						icon: "fa-balance-scale",
						iconOpacity,
						title: this.$t("legalLabels.label"),
					};
					break;

				default:
					break;
			};

			result.id = this.itemId;

			return result;
		},
		
		requiredLegalInfoItemKeys() {
			return [
				"user_agreement", 
				"personal_data_processing_policy"
			];
		},
	},

	methods: {
		action() {
			this.$emit("action", this.item);
		},
	},
}