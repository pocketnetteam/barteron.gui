import Profile from "@/components/profile/index.vue";
import SafeDealStatus from "@/components/safe-deal/safe-deal-status/index.vue";

export default {
	name: "Aside",

	components: {
		Profile,
		SafeDealStatus,
	},

	inject: ['dialog'],

	data() {
		return {
			isLoaded: false,
		}
	},

	computed: {
		content() {
			return this.isLoaded ? this.$components.content : null;
		},

		validatorAddress() {
			return this.$route.query.validator;
		},

		account() {
			return this.sdk.barteron.accounts[this.validatorAddress];
		},

		userHasAccess() {
			return this.content?.userHasAccess;
		},

		statusItems() {
			return this.content?.statusItems || [];
		},

		currentStatus() {
			return this.content?.currentStatus || "";
		},
	},

	methods: {
		openSafeDealRoom() {
			this.content?.openSafeDealRoom();
		},

		updateDealStatus() {
			this.content?.updateDealStatus();
		}
	},

	mounted() {
		this.$2watch("$components.content").then(() => {
			this.isLoaded = true;
		});
	}
}