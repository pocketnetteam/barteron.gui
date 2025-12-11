import SafeDealDialog from "@/components/safe-deal/safe-deal-dialog/index.vue";
import Vue from 'vue';

export default {
	name: "SafeDeal",

	components: {
		
	},

	inject: ['lightboxContainer'],

	props: {
		safeDeal: {
			type: Object,
			default: () => ({})
		},
		mode: String,
		holderClass: String,
	},

	data() {
		return {
			validatorFeeVariantsEnabled: false,
			validatorFeeVariant: "",
		}
	},

	computed: {
		isEditMode() {
			return (this.mode === "edit");
		},

		isViewMode() {
			return !(this.isEditMode);
		},

		validatorFeeVariants() {
			return ["seller", "inHalf"];
		},

		variantDescription() {
			let result = "";
			if (this.validatorFeeVariant === "seller") {
				result = this.$t("safeDealLabels.offer_validator_fee_variant_seller_description");
			} else if (this.validatorFeeVariant === "inHalf") {
				result = this.$t("safeDealLabels.offer_validator_fee_variant_in_half_description");
			};
			return result;
		},
	},

	methods: {
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

		validate() {
			let result = true;
			if (this.validatorFeeVariantsEnabled && !(this.validatorFeeVariant)) {
				result = false;
			};
			return result;
		},

		validatedValue() {
			return this.validate() ? true : null;
		},

		serialize() {
			let result = {};
			if (this.validatorFeeVariantsEnabled) {
				result = {
					validatorFeeVariant: this.validatorFeeVariant,
				};
			};
			return result;
		},

		validatorFeeVariantsEnabledStateChanged(value, e) {
			const checked = e.target.checked;
			this.validatorFeeVariantsEnabled = checked;
			if (!(checked)) {
				this.validatorFeeVariant = "";
			}
			this.$emit("safeDealVisibilityUpdated", this);
		},

		changeValidatorFeeVariant(value) {
			const isValid = this.validatorFeeVariants.includes(value);
			this.validatorFeeVariant = isValid ? value : "";
		},

		fillSafeDeal() {
			const 
				value = this.safeDeal?.validatorFeeVariant,
				isValid = this.validatorFeeVariants.includes(value);
			
			this.validatorFeeVariantsEnabled = isValid;
			this.validatorFeeVariant = isValid ? value : "";
		},

	},

	mounted() {
		this.fillSafeDeal();
	},

	watch: {
		safeDeal() {
			this.fillSafeDeal();
		}
	}
}