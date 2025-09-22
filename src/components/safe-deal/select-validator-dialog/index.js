import i18n from "@/i18n/index.js";
import router from "@/router.js";
import Profile from "@/components/profile/index.vue";
import Loader from "@/components/loader/index.vue";

export default {
	name: "SelectValidatorDialog",

	i18n,

	router,

	components: {
		Profile,
		Loader,
	},

	props: {
		excludedAddresses: {
			type: Array,
			default: () => []
		},
		forcedSelectedAddress: {
			type: String,
			default: null
		}
	},

	data() {
		return {
			lightbox: false,
			selectedIndex: null,
			isLoading: false,
			loadingTimerId: null,
		}
	},

	computed: {
		accounts() {
			const 
				settings = this.sdk.getSafeDealSettings(),
				allItems = settings.validatorAddresses.filter(f => !(this.excludedAddresses.includes(f)));

			return allItems.map(m => this.sdk.barteron.accounts[m]);
		},

 		filteredItems() {
			const result = this.accounts
				.filter(f => f?.safeDeal?.validator?.status === "available" && f?.safeDeal?.validator?.feePercent)
				.sort((a,b) => {
					const 
						aValue = (a.safeDeal?.validator?.feePercent || 100),
						bValue = (b.safeDeal?.validator?.feePercent || 100);
					
					return (aValue !== bValue) ? 
						(aValue - bValue)
						: (a.address > b.address ? 1 : -1);
				})
				.map(m => m.address);
			
			const needShiftToTheTopAndSelect = this.forcedSelectedAddress;
			if (needShiftToTheTopAndSelect) {
				const index = result.findIndex(f => f === this.forcedSelectedAddress);
				if (index > -1) {
					const 
						removedItems = result.splice(index, 1),
						target = removedItems[0];

					if (target) {
						result.unshift(target);
						if (!(this.selectedIndex)) {
							this.selectedIndex = 0;
						}
					};
				};
			};

			return result;
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

		select() {
			const 
				profile = this.$refs[`profile-${this.selectedIndex}`]?.[0],
				account = profile?.account,
				validator = {address: account?.address, settings: account?.safeDeal?.validator};

			this.$emit('onSelect', validator);
			this.hide();
		},

		remove() {
			clearTimeout(this.loadingTimerId);
			
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		},
	},

	mounted() {
		this.isLoading = true;
		this.loadingTimerId = setTimeout(() => {
			this.isLoading = false;
		}, 10000);
	}
}