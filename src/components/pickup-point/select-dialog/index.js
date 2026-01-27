import i18n from "@/i18n/index.js";
import router from "@/router.js";
import BarterItem from "@/components/barter/item/details/index.vue";
import Votes from "@/components/votes/index.vue";
import LinkifiedText from "@/components/linkified-text/index.vue";

export default {
	name: "SelectPickupPointDialog",

	components: {
		BarterItem,
		Votes,
		LinkifiedText,
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

	computed: {
		dialogTitle() {
			let key = "pickup_point";
			if (this.item?.isSelfPickup) {
				key = "self_pickup_additional_info";
			} else if (this.item?.isDirectDelivery) {
				key = "direct_delivery_additional_info";
			};
			return this.$t(`deliveryLabels.${key}`);
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