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
			filteredAdresses: null,
			isLoading: false,
			loadingError: null,
		}
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
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);
		},

		repeatLoading() {
			this.loadValidatorAdresses();
		},

		loadValidatorAdresses() {
			this.resetData();
			this.isLoading = true;
			Promise.resolve().then(() => {
				const settings = this.sdk.getSafeDealSettings();
				return settings.validatorAddresses.filter(f => !(this.excludedAddresses.includes(f)));
			}).then(adresses => {
				return this.sdk.getBrtAccounts(adresses);
			}).then(accounts => {
				this.filteredAdresses = this.getFilteredAdresses(accounts);
			}).catch(e => {
				this.loadingError = e;
			}).finally(() => {
				this.isLoading = false;
			})
		},

		resetData() {
			this.filteredAdresses = null;
			this.loadingError = null;
		},

 		getFilteredAdresses(accounts) {
			const result = accounts
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

	mounted() {
		this.loadValidatorAdresses();
	}
}