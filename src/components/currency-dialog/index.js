import i18n from "@/i18n/index.js";
import { currencies } from "@/i18n/index.js";

export default {
	name: "SelectCurrencyDialog",

	i18n,

	props: {
		selected: {
			type: String,
			default: ""
		},
	},

	data() {
		return {
			lightbox: false,
		}
	},

	computed: {
		currencyItems() {
			return currencies.sort(this.$root.$i18n.locale).map(currency => ({
				text: currency.code,
				value: currency.code,
				graphem: currency.graphem,
			}));
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

		select(item) {
			this.selected = item.value;
			setTimeout(() => {
				this.$emit("onSelect", this.selected);
				this.hide();
			}, 150);
		},

		remove() {
			this.$destroy();
			this.$el.parentNode?.removeChild(this.$el);			
		}
	},
}