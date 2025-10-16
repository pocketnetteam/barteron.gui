import SafeDealDialog from "@/components/safe-deal/safe-deal-dialog/index.vue";
import Vue from 'vue';

export default {
	name: "BarterExchange",

	inject: ['lightboxContainer'],

	props: {
		purchaseStateLabels: {
			type: Boolean,
			default: false
		}
	},

	computed: {
		mainComponent() {
			return this.isLoaded ? this.$components.content?.$refs.barterItem : null;
		},
	},

	data() {
		return {
			isLoaded: false,
		}
	},

	methods: {
		purchaseState() {
			return this.mainComponent?.purchaseState;
		},

		exchangeAvailable() {
			return this.mainComponent?.exchangeAvailable;
		},

		isChatLoading() {
			return this.mainComponent?.isChatLoading;
		},

		selectOffer() {
			this.mainComponent?.selectOfferToExchange?.();
		},

		startPurchase() {
			this.mainComponent?.startPurchase?.();
		},

		waitForPickupPoint() {
			this.mainComponent?.waitForPickupPoint?.();
		},

		buyAtSelectedPickupPoint() {
			this.mainComponent?.buyAtSelectedPickupPoint?.();
		},

		getSafeDealHint() {
			let key = "hint_for_purchase";
			const variant = this.mainComponent?.item?.safeDeal?.validatorFeeVariant;
			if (variant === "seller") {
				key = "offer_validator_fee_variant_seller_description";
			} else if (variant === "inHalf") {
				key = "offer_validator_fee_variant_in_half_description";
			};
			return this.$t(`safeDealLabels.${key}`);
		},

		showSafeDealInfo() {
			const ComponentClass = Vue.extend(SafeDealDialog);
			const instance = new ComponentClass({
				propsData: {},
			});
			
			instance.$on('onHide', vm => {
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},
	},

	mounted() {
		this.$2watch("$components.content?.$refs.barterItem").then(() => {
			this.isLoaded = true;
		});
	}
}