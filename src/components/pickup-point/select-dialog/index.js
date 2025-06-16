import i18n from "@/i18n/index.js";
import router from "@/router.js";
import BarterItem from "@/components/barter/item/details/index.vue";
import Votes from "@/components/votes/index.vue";

export default {
	name: "SelectPickupPointDialog",

	components: {
		BarterItem,
		Votes,
	},

	i18n,

	router,

	props: {
		item: {
			type: Object,
			default: () => ({})
		},
		isSelected: {
			type: Boolean,
			default: false
		},
		mode: {
			type: String,
			required: true
		},
		actionButtonSettings: {
			type: Object,
			default: () => ({
				i18nKeys: {
					regular: "select",
					isSelected: "cancel",
				},
				vType: {
					regular: undefined,
					isSelected: "hit",
				},
			})
		},
	},

	data() {
		return {
			lightbox: false,
		}
	},

	provide() {
		return {
			dialog: new Proxy({}, { get: () => this.dialog }),
		};
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

		dialogAction() {
			this.$emit("onDialogAction", this);
			this.hide();
		},

		remove() {
			this.$destroy();
			this.$el.parentNode.removeChild(this.$el);			
		}
	},

	watch: {
		$route() {
			if (this.lightbox) {
				this.hide();
			}
		}
	},
}