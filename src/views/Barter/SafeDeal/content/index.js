import AppErrors from "@/js/appErrors.js";
import Loader from "@/components/loader/index.vue";

// TODO: localization
// TODO: check if getFromToTransactions is available
// TODO: show status complete preview after success tx
// TODO: chat button implamentation

export default {
	name: "Content",

	components: {
		Loader,
	},

	inject: ["dialog"],

	data() {
		return {
			statusesLoading: false,
			statusesLoadingError: null,
			statusItems: [],
			currentStatus: "",
			buyerCheckStatus1Enabled: false,
			status1BuyerSafeDealValue: 0,
			status1BuyerValidatorFeeVariant: "",
			validatorCheckStatus2Enabled: false,
			status2ValidatorDealResultVariant: "",
			txFromBuyerToValidator: [],
			txfromValidatorToSeller: [],
			txfromValidatorToBuyer: []
		}
	},

	computed: {
		offer() {
			return this.sdk.barteron.offers[this.$route.query?.offer];
		},

		buyerAddress() {
			return this.$route.query.buyer;
		},

		sellerAddress() {
			return this.offer?.address;
		},

		validatorAddress() {
			return this.$route.query.validator;
		},

		validatorFeePercent() {
			return this.$route.query.percent || 10;
		},

		userRole() {
			let result = "";

			switch (this.address) {
				case this.buyerAddress:
					result = "buyer";
					break;

				case this.sellerAddress:
					result = "seller";
					break;

				case this.validatorAddress:
					result = "validator";
					break;

				default:
					break;
			}

			return result;
		},

		id() {
			return this.$route.query.id;
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

		userHasAccess() {
			return !!(this.userRole);
		},

		actionsListTitle() {
			const key = (this.dealCompleted ? `status_${ this.currentStatus }` : "follow_the_steps");
			return this.$t(`safeDealLabels.${key}`) + (key === "follow_the_steps" ? ":" : "");
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

		status1BuyerPaymentPercent() {
			let result = null;

			switch (this.status1BuyerValidatorFeeVariant) {
				case "buyer":
					result = 100;
					break;
			
				case "seller":
					result = 0;
					break;

				case "inHalf":
					result = 50;
					break;

				default:
					break;
			}

			return result;
		},


		status1BuyerTransferAmount() {
			const
				paymentPercent =  this.status1BuyerPaymentPercent,
				k = (paymentPercent !== null ? (paymentPercent / 100) : null);

			let result = 0;
			if (k !== null) {
				const amount = (this.status1BuyerSafeDealValue * (1 + k * this.validatorFeePercent / 100));
				result = Number(amount.toFixed(2));
			};

			return result;
		},

		status2ValidatorCalculationList() {
			return [
				"item 1",
				"item 2",
				"item 3",
			];
		},

		status2ValidatorTransferAmount() {
			let amount = 0;
			const 
				s = this.txFromBuyerToValidator.reduce((acc, item) => acc + item.amount, 0) * 1E-8,
				yes = this.status2ValidatorDealResultVariant === "yes",
				no = this.status2ValidatorDealResultVariant === "no";
			
			if (yes) {
				amount = s / (1 + this.validatorFeePercent / 100);
			} else if (no) {
				amount = s;
			}

			return  Number(amount.toFixed(2));
		},

		dealCompleted() {
			return (this.currentStatus === "4a" || this.currentStatus === "4b");
		},

	},

	methods: {
		isStatus(value) {
			return this.currentStatus === value;
		},

		updateStatus() {
			this.statusesLoadingError = null;
			this.statusesLoading = true;

			const 
				depth = 3461065, // there is no need to analyze transactions before this block (approximate start block of the safe deal feature)
				idHex = this.sdk.hexEncode(this.id),
				opreturn = [`6a10${idHex}`, `6a1b${idHex}`, `6a20${idHex}`];

			Promise.all([
				this.sdk.getFromToTransactions(this.buyerAddress, this.validatorAddress, true, depth, opreturn),
				this.sdk.getFromToTransactions(this.validatorAddress, this.sellerAddress, true, depth, opreturn),
				this.sdk.getFromToTransactions(this.validatorAddress, this.buyerAddress, true, depth, opreturn),
			]).then(results => {
				[
					this.txFromBuyerToValidator  = [],
					this.txfromValidatorToSeller = [],
					this.txfromValidatorToBuyer  = [],
				] = results;

				this.statusItems = "1,2,3a,4a".split(",");
				this.currentStatus = "1";

				if (this.txFromBuyerToValidator.length) {
					this.currentStatus = "2";
				};

				if (this.txfromValidatorToSeller.length) {
					this.currentStatus = "4a";
				} else if (this.txfromValidatorToBuyer.length) {
					this.statusItems = "1,2,3b,4b".split(",");
					this.currentStatus = "4b";
				};
				
				console.log('Promise.all(getFromToTransactions)', results);

			}).catch(e => {
				this.statusesLoadingError = e;
				this.statusItems = [];
				this.currentStatus = "";
			}).finally(() => {
				this.statusesLoading = false;
			});
		},

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
			const variants = ["buyer", "seller", "inHalf"];
			const isValid = variants.includes(value);
			this.status1BuyerValidatorFeeVariant = isValid ? value : "";
		},

		validatorCheckStatus2StateChanged(value, e) {
			this.validatorCheckStatus2Enabled = e.target.checked;
		},

		changeStatus2ValidatorDealResultVariant(value) {
			const variants = ["yes", "no"];
			const isValid = variants.includes(value);
			this.status2ValidatorDealResultVariant = isValid ? value : "";
		},

		transferPaymentToValidatorEvent() {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.transfer_payment_to_validator"))
				.then(state => {
					if (state) {
						this.transferPaymentToValidator();
					}
				});
		},

		transferPaymentToValidator() {
			const 
				id = this.id,
				amount = this.status1BuyerTransferAmount,
				percent = this.validatorFeePercent,
				paymentPercent = this.status1BuyerPaymentPercent;
			
			if (paymentPercent === null || !(id && amount && percent)) {
				const error = new Error("Internal error: payment parameters not defined");
				this.showError(error);
				return;
			};

			const 
				address = this.validatorAddress,
				feemode = "exclude",
				message = `${id}`;

			const data = {
				recievers: [{
					address,
					amount,
				}],
				feemode,
				message,
			};

			this.sdk.makePayment(data).then(result => {
				this.showSuccess(this.$t("dialogLabels.transfer_complete"));
			}).catch(e => {
				const 
					isPaymentError = (e instanceof AppErrors.PaymentError),
					needShow = !(isPaymentError && e.canceled);

				if (needShow) {
					this.showError(e);
				} else {
					console.error(e);
				};
			});
		},

		transferPaymentFromValidator() {
			
		},
	},

	mounted() {
		this.$2watch("sellerAddress").then(() => {
			this.updateStatus();
		});
	},
}