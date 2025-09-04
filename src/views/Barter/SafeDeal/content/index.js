import Loader from "@/components/loader/index.vue";

// TODO: localization

export default {
	name: "Content",

	components: {
		Loader,
	},

	inject: ["dialog"],

	data() {
		return {
			statusItems: [],
			currentStatus: "2",
		}
	},

	computed: {

		userRole() {
			let result = "";

			const {buyer, seller, validator} = this.$route.query;
			switch (this.address) {
				case buyer:
					result = "buyer";
					break;
			
				case seller:
					result = "seller";
					break;

				case validator:
					result = "validator";
					break;

				default:
					break;
			}

			return result;
		},

		userHasAccess() {
			return !!(this.userRole);
		},

		actionsListTitle() {
			const key = (this.dealCompleted ? `status_${ this.currentStatus }` : "follow_the_steps");
			return this.$t(`safeDealLabels.${key}`);
		},

		actionsList() {
			let result = [];
			let step = 1;

			const i18nKey = (step) => {
				return `safeDealLabels.status_${ this.currentStatus }_role_${ this.userRole }_step_${ step }`;
			}

			while (this.$te(i18nKey(step))) {
				result.push(this.$t(i18nKey(step)));
				step++;
			}

			return result;
		},

		infoList() {
			let result = [];
			let info = 1;

			const i18nKey = (step) => {
				return `safeDealLabels.status_${ this.currentStatus }_role_${ this.userRole }_info_${ info }`;
			}

			while (this.$te(i18nKey(info))) {
				result.push(this.$t(i18nKey(info)));
				info++;
			}

			return result;
		},

		dealCompleted() {
			return (this.currentStatus === "4a" || this.currentStatus === "4b");
		},

	},

	methods: {
	},

	mounted() {
		this.statusItems = "1,2,3b,4b".split(","); //"1,2,3a,4a".split(",");
	},
}