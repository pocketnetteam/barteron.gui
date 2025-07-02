import ReferralDialog from "@/components/referral-dialog/index.vue";
import Vue from 'vue';

export default {
	name: "Wallet",

	inject: ['lightboxContainer'],

	computed: {
		/**
		 * Get account balance
		 * 
		 * @returns {Object}
		 */
		balance() {
			return this.sdk.balance;
		},
	},

	methods: {
		showReferralProgramInfo() {
			const ComponentClass = Vue.extend(ReferralDialog);
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

	created() {
		this.sdk.getBalance();
	}
}