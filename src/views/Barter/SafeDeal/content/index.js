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
			currentStatus: "1",
			buyerCheckStatus1Enabled: false,
			status1BuyerSafeDealValue: 0,
			status1BuyerValidatorFeeVariant: "",
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

		isBuyer() {
			return this.userRole === "buyer";
		},

		isSeller() {
			return this.userRole === "seller";
		},

		isValidator() {
			return this.userRole === "validator";
		},

		validatorFeePercent() {
			return this.$route.query.percent || 10;
		},

		isStatus1() {
			return this.currentStatus === "1";
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

		status1BuyerTransferAmount() {
			let result = 0;

			switch (this.status1BuyerValidatorFeeVariant) {
				case "buyer":
					result = this.status1BuyerSafeDealValue * (1 + this.validatorFeePercent / 100);
					break;
			
				case "seller":
					result = this.status1BuyerSafeDealValue;
					break;

				case "inHalf":
					result = this.status1BuyerSafeDealValue * (1 + 0.5 * this.validatorFeePercent / 100);
					break;

				default:
					break;
			}

			result = result.toFixed(2);

			return result;
		},

		dealCompleted() {
			return (this.currentStatus === "4a" || this.currentStatus === "4b");
		},

	},

	methods: {
		buyerCheckStatus1StateChanged(value, e) {
			this.buyerCheckStatus1Enabled = e.target.checked;
		},

		changeStatus1BuyerSafeDealValue(e) {
			const
				inputs = this.$refs.status1BuyerSafeDealValue?.inputs,
				input = inputs[0].value;
			
			this.status1BuyerSafeDealValue = !(Number.isNaN(Number(input))) ? Math.max(Number(input),0) : 0;
		},

		changeStatus1BuyerValidatorFeeVariant(value) {			
			const options = ["buyer", "seller", "inHalf"];
			const isValid = options.includes(value);
			if (isValid) {
				this.status1BuyerValidatorFeeVariant = value;
			} else {
				this.status1BuyerValidatorFeeVariant = "";
			};
		},
	},

	mounted() {
		this.statusItems = "1,2,3b,4b".split(","); //"1,2,3a,4a".split(",");
	},
}