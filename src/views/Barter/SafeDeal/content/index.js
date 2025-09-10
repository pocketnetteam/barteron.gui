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
			validatorCheckStatus2Enabled: false,
			status2ValidatorDealResultVariant: "",
			txFromBuyerToValidator: [],
			txFromValidatorToSeller: [],
			txFromValidatorToBuyer: []
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

		validatorFeeVariant() {
			let result = "buyer";

			// // after adding this option in offer entity
			// const safeDeal = this.offer?.safeDeal
			// if (safeDeal?.isEnabled) {
			// 	const isValid = ["seller", "inHalf"].includes(safeDeal?.validatorFeeVariant);
			// 	result = isValid ? safeDeal?.validatorFeeVariant : result;
			// }

			return result;
		},

		validatorFeeVariantTitle() {
			let key = "";
			
			switch (this.validatorFeeVariant) {
				case "buyer":
					key = "validator_fee_variant_buyer";
					break;

				case "seller":
					key = "validator_fee_variant_seller";
					break;
					
				case "inHalf":
					key = "validator_fee_variant_in_half";
					break;

				default:
					break;
			}

			return key ? this.$t(`safeDealLabels.${key}`) : "";
		},

		buyerPaymentPercent() {
			let result = null;

			switch (this.validatorFeeVariant) {
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

		paymentTransferMessage() {
			return `Safe deal ${this.id}`;
		},

		status1BuyerTransferAmount() {
			let result = 0;
			const k = (this.buyerPaymentPercent !== null ? (this.buyerPaymentPercent / 100) : null);
			if (k !== null) {
				const amount = (this.status1BuyerSafeDealValue * (1 + k * this.validatorFeePercent / 100));
				result = Number(amount.toFixed(2));
			};
			return result;
		},

		status2ValidatorCalculationList() {
			let result = [];

			const yesVariant = this.status2ValidatorDealResultVariant === "yes";
			if (yesVariant) {
				const 
					payment = this.txFromBuyerToValidator.reduce((acc, item) => acc + item.amount, 0) * 1E-8,
					k = this.buyerPaymentPercent !== null ? (this.buyerPaymentPercent / 100) : 1,
					safeDealValue = payment / (1 + k * this.validatorFeePercent / 100),
					validatorFee = safeDealValue * this.validatorFeePercent / 100;

				result = [
					this.$t("safeDealLabels.calculation_success_deal_item1", {value: this.$n(safeDealValue, 'shortPkoin')}),
					this.$t("safeDealLabels.calculation_success_deal_item2", {value1: this.validatorFeePercent, value2: this.$n(validatorFee, 'shortPkoin')}),
					this.$t("safeDealLabels.calculation_success_deal_item3", {variant: this.validatorFeeVariantTitle}),
					this.$t("safeDealLabels.calculation_success_deal_item4", {value: this.$n(payment, 'shortPkoin')}),					
					this.$t("safeDealLabels.calculation_success_deal_item5", {value: this.$n(this.status2ValidatorTransferAmount, 'shortPkoin')}),
				];
			}

			return result;
		},

		status2ValidatorTransferAmount() {
			let amount = 0;

			const 
				payment = this.txFromBuyerToValidator.reduce((acc, item) => acc + item.amount, 0) * 1E-8,
				yesVariant = this.status2ValidatorDealResultVariant === "yes",
				noVariant = this.status2ValidatorDealResultVariant === "no";
			
			if (yesVariant) {
				amount = payment / (1 + this.validatorFeePercent / 100);
			} else if (noVariant) {
				amount = payment;
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
				payloadLength = this.paymentTransferMessage.length,
				OP_RETURN = 106,
				concatSymbol = (payloadLength & 0xff),
				message = [
					String.fromCodePoint(OP_RETURN),
					String.fromCodePoint(concatSymbol),
					this.paymentTransferMessage
				].join(""),
				opreturn = this.sdk.hexEncode(message);

			Promise.all([
				this.sdk.getFromToTransactions(this.buyerAddress, this.validatorAddress, true, depth, opreturn),
				this.sdk.getFromToTransactions(this.validatorAddress, this.sellerAddress, true, depth, opreturn),
				this.sdk.getFromToTransactions(this.validatorAddress, this.buyerAddress, true, depth, opreturn),
			]).then(results => {
				[
					this.txFromBuyerToValidator  = [],
					this.txFromValidatorToSeller = [],
					this.txFromValidatorToBuyer  = [],
				] = results;

				this.statusItems = "1,2,3a,4a".split(",");
				this.currentStatus = "1";

				if (this.txFromBuyerToValidator.length) {
					this.currentStatus = "2";
				};

				if (this.txFromValidatorToSeller.length) {
					this.currentStatus = this.statusItems[this.statusItems.length - 1];
				} else if (this.txFromValidatorToBuyer.length) {
					this.statusItems = "1,2,3b,4b".split(",");
					this.currentStatus = this.statusItems[this.statusItems.length - 1];
				};
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
				amount = this.status1BuyerTransferAmount,
				percent = this.validatorFeePercent,
				message = this.paymentTransferMessage;
			
			if (this.buyerPaymentPercent === null || !(amount && percent && message)) {
				const error = new Error("Internal error: payment parameters not defined");
				this.showError(error);
				return;
			};

			const 
				address = this.validatorAddress,
				feemode = "exclude";

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
			const 
				amount = this.status2ValidatorTransferAmount,
				message = this.paymentTransferMessage;

			if (!(amount && message)) {
				const error = new Error("Internal error: payment parameters not defined");
				this.showError(error);
				return;
			};

			const 
				yesVariant = (this.status2ValidatorDealResultVariant === "yes"),
				address = (yesVariant ? this.sellerAddress : this.buyerAddress),
				feemode = yesVariant ? "exclude" : "include";

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
	},

	mounted() {
		this.$2watch("sellerAddress").then(() => {
			this.updateStatus();
		});
	},
}