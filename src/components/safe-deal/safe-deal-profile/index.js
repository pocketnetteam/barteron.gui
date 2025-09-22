import { mapState } from "pinia";
import {
	default as LocaleStore,
	useLocaleStore
} from "@/stores/locale.js";

export default {
	name: "SafeDealProfile",

	components: {
		
	},

	props: {
		hash: {
			type: String,
		},
	},

	data() {
		return {
			status: null,
			feePercent: 0,
			editing: false,
			isLoading: false,
		}
	},

	inject: ["dialog"],

	computed: {
		...mapState(useLocaleStore, ["locale"]),

		isMyProfile() {
			return this.hash === this.sdk.address;
		},

		account() {
			return this.sdk.barteron.accounts[this.hash];
		},

		isEditable() {
			return (this.isMyProfile);
		},

		statuses() {
			return {
				available: "available",
				unavailable: "unavailable",
			}
		},

		statusItems() {
			return Object.values(this.statuses);
		},

		statusDropdownList() {
			const icons = {
				[this.statuses.available]: "fa-check-circle",
				[this.statuses.unavailable]: "fa-ban",
			};

			const items = this.statusItems.map(item => ({
				value: item,
				icon: icons[item],
				title: this.$t(`safeDealLabels.validator_status_${ item }`),
			}));

			return items.map(item => ({
				text: `<i class='fa icon ${ item.icon } ${ item.value } '></i> <span>${ item.title }</span>`,
				value: item.value,
				selected: (item.value === this.status),
			}));
		},
		
	},

	methods: {
		fillSafeDeal() {
			const 
				settings = this.sdk.getSafeDealSettings(),
				defaultValues = settings.defaultValidatorValues;

			this.status = this.account?.safeDeal?.validator?.status || this.statuses.unavailable;
			this.feePercent = this.account?.safeDeal?.validator?.feePercent || defaultValues.feePercent;
		},

		edit() {
			this.editing = true;
		},

		save() {
			if (!(this.checkData())) {
				return;
			};

			const validator = {
				status: this.status,
				feePercent: this.feePercent,
			};

			let safeDeal = this.account?.safeDeal || {};
			safeDeal = {
				...safeDeal,
				validator,
			};

			this.isLoading = true;

			this.account.set({ safeDeal }).then(() => {
				this.editing = false;
				this.sdk.alertMessage(this.$t("dialogLabels.saving_data_message"));
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isLoading = false;
			});
		},

		checkData() {
			const result = (0 < this.feePercent && this.feePercent < 99);
			if (!(result)) {
				this.showError(this.$t("dialogLabels.validator_fee_value_error"));
			}
			return result;
		},

		cancel() {
			this.fillSafeDeal();
			this.editing = false;
		},

		selectStatusEvent(newValue) {
			const 
				newStatus = newValue?.value,
				isValid = this.statusItems.includes(newStatus);

			if (isValid) {
				this.status = newStatus;
			};
		},

		changeFeePercentEvent(e) {
			const
				inputs = this.$refs.feePercent?.inputs,
				input = inputs[0].value;
			
			this.feePercent = !(Number.isNaN(Number(input))) ? Math.min( Math.max(Number(input),0), 99) : 0;
		},

	},

	mounted() {
		this.fillSafeDeal();
	},

	watch: {
		account() {
			this.fillSafeDeal();
		},

		locale() {
			this.$refs.status?.updateButton();
		},

		status() {
			this.$refs.status?.updateButton();
		},
	}
}