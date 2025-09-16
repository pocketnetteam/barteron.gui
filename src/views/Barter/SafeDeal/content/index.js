import AppErrors from "@/js/appErrors.js";
import Loader from "@/components/loader/index.vue";
import SafeDealStore from "@/stores/safeDeal.js";
import Profile from "@/components/profile/index.vue";
import SafeDealStatus from "@/components/safe-deal/safe-deal-status/index.vue";
import SafeDealUtils from "@/js/safeDealUtils.js";

// TODO: localization

export default {
	name: "Content",

	components: {
		Loader,
		Profile,
		SafeDealStatus,
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
			txFromValidatorToBuyer: [],
			waitingForPaymentConfirmation: false,
		}
	},

	computed: {
		successfulStatusItems() {
			return "1,2,3a,4a".split(",");
		},

		failedStatusItems() {
			return "1,2,3b,4b".split(",");
		},

		completionStatus() {
			return this.statusItems[this.statusItems.length - 1];
		},

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

		shownUserData() {
			let 
				title = "",
				address = null;

			if (this.userRole) {
				const key = this.isValidator ? "buyer" : "deal_validator";
				title = this.$t(`safeDealLabels.${key}`)

				address = this.isValidator ? this.buyerAddress : this.validatorAddress;
			};

			return {
				title, 
				address,
			};
		},

		actionsListTitle() {
			const 
				key = (this.dealCompleted ? `status_${ this.completionStatus }` : "follow_the_steps"),
				postfix = (key === "follow_the_steps" ? ":" : ""),
				statusUpdated = (this.currentStatus);

			return statusUpdated ? (this.$t(`safeDealLabels.${key}`) + postfix) : "";
		},

		actionsList() {
			let result = [];

			const key = (step) => {
				return this.waitingForPaymentConfirmation ? 
					`safeDealLabels.waiting_for_payment_confirmation_step_${ step }`
					: `safeDealLabels.status_${ this.currentStatus }_role_${ this.userRole }_step_${ step }`;
			}

			let step = 1;
			while (this.$te(key(step))) {
				result.push(this.$t(key(step)));
				step++;
			}

			return result;
		},

		infoList() {
			let result = [];
			let info = 1;

			const key = (info) => {
				return this.waitingForPaymentConfirmation ? 
					`safeDealLabels.waiting_for_payment_confirmation_info_${ info }`
					: `safeDealLabels.status_${ this.currentStatus }_role_${ this.userRole }_info_${ info }`;
			}

			while (this.$te(key(info))) {
				result.push(this.$t(key(info)));
				info++;
			}

			return result;
		},

		transactionsRequestParams() {
			return {
				minConfirmationsForPayment: 6,
				minDepthForSafeDealFeature: 3466240, // there is no need to analyze transactions before this block (approximate start block of the safe deal feature)
			};
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

		status1BuyerCalculationList() {
			const
				validatorFee = this.status1BuyerSafeDealValue * this.validatorFeePercent / 100,
				payment = this.status1BuyerTransferAmount;

			return [
				this.$t("safeDealLabels.calculation_start_deal_item1", {value: this.$n(this.status1BuyerSafeDealValue, 'shortPkoin')}),
				this.$t("safeDealLabels.calculation_start_deal_item2", {value1: this.validatorFeePercent, value2: this.$n(validatorFee, 'shortPkoin')}),
				this.$t("safeDealLabels.calculation_start_deal_item3", {variant: this.validatorFeeVariantTitle}),
				this.$t("safeDealLabels.calculation_start_deal_item4", {value: this.$n(payment, 'shortPkoin')}),					
			];
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
			return (this.currentStatus === this.completionStatus);
		},

	},

	methods: {
		isStatus(value) {
			return this.currentStatus === value;
		},

		updateStatus() {
			if (!(this.checkSafeDealData())) {
				return;
			}

			this.statusesLoadingError = null;
			this.statusesLoading = true;

			const 
				params = this.transactionsRequestParams,
				options = {
					update: true,
					depth: params.minDepthForSafeDealFeature,
					opreturn: this.getOpreturnMessage(),
					confirmations: params.minConfirmationsForPayment,
				};

			Promise.all([
				this.sdk.getFromToTransactions(this.buyerAddress, this.validatorAddress, options),
				this.sdk.getFromToTransactions(this.validatorAddress, this.sellerAddress, options),
				this.sdk.getFromToTransactions(this.validatorAddress, this.buyerAddress, options),
			]).then(results => {
				[
					this.txFromBuyerToValidator  = [],
					this.txFromValidatorToSeller = [],
					this.txFromValidatorToBuyer  = [],
				] = results;

				this.statusItems = this.successfulStatusItems;
				this.currentStatus = "1";

				if (this.txFromBuyerToValidator.length) {
					this.currentStatus = "2";
				};

				const 
					successfulCompletion = this.txFromValidatorToSeller.length,
					failedCompletion = this.txFromValidatorToBuyer.length,
					isCompleted = (successfulCompletion || failedCompletion);

				if (isCompleted) {
					if (successfulCompletion) {
						this.statusItems = this.successfulStatusItems;
					} else if (failedCompletion) {
						this.statusItems = this.failedStatusItems;
					};
					this.currentStatus = this.completionStatus;
					this.waitingForPaymentConfirmation = false;
					this.removeStoredSafeDeal();
				} else {
					this.checkPaymentStatus();
				};

			}).catch(e => {
				this.statusesLoadingError = e;
				this.statusItems = [];
				this.currentStatus = "";
			}).finally(() => {
				this.statusesLoading = false;
			});
		},

		checkSafeDealData() {
			if (!(this.sdk.getFromToTransactionsIsAvailable())) {
				const error = new Error(this.$t("dialogLabels.get_from_to_transactions_availability_error"));
				this.showError(error, null, () => {
					this.showOffer();
				});
				return false;
			};

			const settings = this.sdk.getSafeDealSettings();
			if (!(settings.validatorAddresses.includes(this.validatorAddress))) {
				const error = new Error("Validator address is invalid");
				this.showError(error);
				return false;
			};

			let isValidId = false;
			try {
				const 
					idHelper = new SafeDealUtils.IdHelper(),
					data = this.$route.query;

				isValidId = idHelper.checkId(this.id, data);
				if (!(isValidId)) {
					throw new Error("Control hash does not match the deal parameters");
				}
			} catch (error) {
				this.showError(error);
				return false;
			}

			return true;
		},

		getOpreturnMessage() {
			const 
				payloadMessage = this.paymentTransferMessage, 
				payloadLength = payloadMessage.length,
				OP_RETURN = 106,
				concatSymbol = (payloadLength & 0xff),
				message = [
					String.fromCodePoint(OP_RETURN),
					String.fromCodePoint(concatSymbol),
					payloadMessage
				].join(""),
				result = this.sdk.hexEncode(message);

			return result;
		},

		checkPaymentStatus() {
			const 
				storedSafeDeal = SafeDealStore.get(this.id),
				waitingIntervalMs = 15 * 60 * 1000;

			this.waitingForPaymentConfirmation = (storedSafeDeal ? 
				(storedSafeDeal.currentStatus === this.currentStatus 
					&& (Date.now() - storedSafeDeal.timestamp) < waitingIntervalMs) 
				: false
			);
		},

		removeStoredSafeDeal() {
			SafeDealStore.remove(this.id);
		},

		openSafeDealRoom() {
			this.sendSafeDealMessage();
		},

		shareSafeDealTransaction(txid) {
			const 
				messages = [`bastyon://transactionview?stx=${txid}`],
				options = {
					openRoom: false,
					dialogMessage: this.$t("dialogLabels.sending_transaction")
				};

			this.sendSafeDealMessage(messages, options);
		},

		sendSafeDealMessage(
			messages = [], 
			options = {}
		) {
			if (this.sdk.willOpenRegistration()) return;

			if (!(this.checkSafeDealData())) return;

			const data = {
				name: this.id,
				members: [this.buyerAddress, this.sellerAddress, this.validatorAddress],
				messages: (messages || []),
				openRoom: (options?.openRoom ?? true),
			};

			const 
				defaultDialogMessage = data.openRoom ? 
					this.$t("dialogLabels.opening_room")
					: this.$t("dialogLabels.sending_message"),
				dialogMessage = options?.dialogMessage || defaultDialogMessage;

			this.isChatLoading = true;
			this.dialog?.instance.view("load", dialogMessage);
			this.sendMessage(data).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isChatLoading = false;
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

			this.makePayment(data);
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

			this.makePayment(data);
		},

		makePayment(data) {
			if (!(this.checkSafeDealData())) return;

			this.sdk.makePayment(data).then(result => {
				this.storeSafeDealData(result.transaction);
				this.showSuccess(this.$t("dialogLabels.transfer_complete_with_transaction_link"), null, () => {
					this.waitingForPaymentConfirmation = true;
					this.shareSafeDealTransaction(result.transaction);
				});
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

		storeSafeDealData(transaction) {
			const data = {
				[this.id]: {
					currentStatus: this.currentStatus,
					timestamp: Date.now(),
					transaction,
				},
			};
			SafeDealStore.add(data);
		},

		evaluatePurchase() {
			this.showOffer({anchorSelector: "section.votes"});
		},

		showOffer(options = {anchorSelector: null}) {
			let to = {
				name: "barterItem",
				params: { id: this.offer?.hash },
			};

			const selector = options?.anchorSelector;
			if (selector) {
				to = {
					...to,
					hash: `#${selector}`,
				};
			};

			this.$router.push(to).catch(e => {
				console.error(e);
				this.showVersionConflictIfNeeded(e);
			});
		}
	},

	mounted() {
		this.$2watch("sellerAddress").then(() => {
			this.updateStatus();
		});
	},
}