import ThemeStore from "@/stores/theme.js";
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

			const iconOpacity = (this.isDarkTheme ? 0.2 : 0.15);

			switch (this.itemId) {
				case "notifications":
					result = {
						backgroundColor: (this.isDarkTheme ? "#736600" : "#FFFAD2"),
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
						backgroundColor: (this.isDarkTheme ? "#2a7600" : "#DCFFC9"),
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

				case "usefulTips":
					result = {
						backgroundColor: (this.isDarkTheme ? "#005a87" : "#D2F0FF"),
						icon: "fa-lightbulb",
						iconOpacity,
						title: this.$t("usefulTipsLabels.label"),
						description: this.$t("stickerLabels.useful_tips_description"),
						action: {
							icon: "✅",
							title: this.$t("stickerLabels.useful_tips_action"),
						},
					};
					break;

				case "legalInfo":
					result = {
						backgroundColor: (this.isDarkTheme ? "#873700" : "#FFECDF"),
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

		isDarkTheme() {
			return ThemeStore.isDarkTheme();
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