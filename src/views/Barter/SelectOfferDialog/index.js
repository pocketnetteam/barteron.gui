import VueI18n from "@/i18n/index.js";

export default {
	name: "SelectOfferDialog",

	props: {
		item: Object,
		items: {
			type: Array,
			default: () => []
		},
	},

	data() {
		return {
			lightbox: false,
			selected: null,
		}
	},

	computed: {
		dialogTitle() {
			return VueI18n.t('barterLabels.select');
		},

		selectButtonTitle() {
			return VueI18n.t('buttonLabels.propose_exchange');
		}
	},

	methods: {
		show() {
			this.lightbox = true;
			this.$emit("onShow", this);
		},

		hide() {
			this.lightbox = false;
			this.$emit("onHide", this);
			this.remove();
		},

		select() {
			this.$emit('onSelect', this);
			this.hide();
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		}
	},
}