import Profile from "@/components/profile/index.vue";
import SafeDealStatus from "@/components/safe-deal/safe-deal-status/index.vue";

export default {
	name: "Aside",

	components: {
		Profile,
		SafeDealStatus,
	},

	data() {
		return {
			isLoaded: false,
		}
	},

	computed: {
		content() {
			return this.isLoaded ? this.$components.content : null;
		},

		id() {
			return this.content?.id;
		},

		shownUserData() {
			return this.content?.shownUserData;
		},

		validatorAddress() {
			return this.content?.validatorAddress;
		},

		userHasAccess() {
			return this.content?.userHasAccess;
		},

		statusesLoading() {
			return this.content?.statusesLoading;
		},

		statusesLoadingError() {
			return this.content?.statusesLoadingError;
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

		updateStatus() {
			this.content?.updateStatus();
		}
	},

	mounted() {
		this.$2watch("$components.content").then(() => {
			this.isLoaded = true;
		});
	}
}