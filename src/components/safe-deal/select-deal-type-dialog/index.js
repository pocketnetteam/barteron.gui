import SafeDealDialog from "@/components/safe-deal/safe-deal-dialog/index.vue";
import Vue from 'vue';
import i18n from "@/i18n/index.js";
import router from "@/router.js";

export default {
	name: "SelectDealTypeDialog",

	i18n,

	router,

	components: {
	},

	props: {
		lightboxContainer: {
			type: Function,
			required: true
		},
		validatorFeeVariant: {
			type: String,
			default: ""
		},
	},

	data() {
		return {
			lightbox: false,
			selectedType: null,
		}
	},

	computed: {
		safeDealFootnote() {
			const key = (this.validatorFeeVariant === "seller" 
				? "validator_fee_is_paid_by_seller" 
				: "validator_fee_required"
			);
			return this.$t(`safeDealLabels.${key}`);
		},
	},

	methods: {
		show() {
			this.lightbox = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.lightbox = false;
			setTimeout(() => {
				this.$emit("onHide", this);
				this.remove();
			}, 300);
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

		selectDealType(value) {
			this.$emit('onSelect', value);
			this.hide();
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},
	},

	mounted() {
	}
}