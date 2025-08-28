import i18n from "@/i18n/index.js";
import banProcessor from "@/js/banUtils.js";

export default {
	name: "SelectOfferDialog",

	i18n,

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
		list() {
			return banProcessor.filteredOffers(this.items);
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