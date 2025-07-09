import NameToHSL from "@/js/nametohsl.js";
import CurrencyStore from "@/stores/currency.js";
import { currencies } from "@/i18n/index.js";
import SelectCurrencyDialog from "@/components/currency-dialog/index.vue";
import Vue from 'vue';

export default {
	name: "UserSubMenu",

	components: {
		SelectCurrencyDialog,
	},

	inject: ["dialog", "lightboxContainer"],

	data() {
		return {
			color: new NameToHSL(),
		}
	},

	computed: {
		address() {
			return this.sdk.address || "%address%";
		},

		user() {
			return this.sdk.accounts[this.sdk.address];
		},

		shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase() || "?";
		},

		avatar() {
			const url = this.user?.i;
			return this.sdk.manageBastyonImageSrc(url);
		},

		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "User") }`
		},

		itemsList() {
			const currencyPostfix = CurrencyStore.currency ? ` (${CurrencyStore.currency})` : '';
			return [
				{
					text: `<i class="fa fa-plus"></i> ${this.$t('buttonLabels.create_barter')}`,
					value: "create_barter",
					default: false,
				},
				{
					text: `<i class="fa fa-user"></i> ${this.$t('buttonLabels.go_to_profile')}`,
					value: "go_to_profile",
					default: false,
				},
				{
					text: `<i class="fa fa-money-bill-alt"></i> ${this.$t('buttonLabels.select_currency')}${currencyPostfix}`,
					value: "select_currency",
					default: false,
				},
			];
		},
	},

	methods: {
		selectItem(item) {
			switch (item.value) {
				case "create_barter":
					this.requestPermissions({ path: '/barter/create' });
					break;
			
				case "go_to_profile":
					this.requestPermissions({ path: `/profile/${ this.address }` });
					break;

				case "select_currency":
					this.showCurrencyDialog();
					break;

				default:
					break;
			};
		},

		requestPermissions(to, permissions = ["account"]) {
			this.sdk.requestPermissions(permissions).then(async () => {
				to.params = { ...to.params || {}, from: this.$route.path };

				if (this.address === "%address%") {
					const
						address = await this.sdk.getAddress(),
						params = to?.params || to || {};

					for (const p in params) {
						params[p] = params[p].replace("%address%", address);
					}
				}

				if (this.sdk.address && !this.user?.name) {
					this.dialog?.instance.view("warn", this.$t("dialogLabels.pending_reg"));
				} else {
					if (this.user?.name && to && to.path != to.params.from) {
						this.$router.push(to).catch(e => {
							console.error(e);
						});
					}
				}
			}).catch(e => {
				this.showError(e);
			});

			return false;
		},

		showCurrencyDialog() {
			const ComponentClass = Vue.extend(SelectCurrencyDialog);
			const instance = new ComponentClass({
				propsData: {
					selected: (CurrencyStore.currency || ""),
				},
			});
			
			instance.$on('onSelect', selected => {
				if (selected && (selected !== CurrencyStore.currency)) {
					CurrencyStore.currency = selected;
				};
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},

	},

	created() {
		const needSetCurrency = !(CurrencyStore.currency);
		if (needSetCurrency) {
			const value = currencies.sort(this.$root.$i18n.locale)[0].code;
			CurrencyStore.set(value);
		}
	},
}