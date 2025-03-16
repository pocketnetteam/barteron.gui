import Loader from "@/components/loader/index.vue";
import PickupPointItem from "@/components/pickup-point/item/index.vue";
import { Carousel, Slide } from "@/components/vue-snap/index.js";
import "@/components/vue-snap/vue-snap.css";

export default {
	name: "PickupPointList",

	components: {
		Loader,
		PickupPointItem,
		Carousel,
		Slide
	},

	props: {
		items: {
			type: Array,
			default: () => []
		},
		selectedOfferIds: {
			type: Array,
			default: () => []
		},
		mode: {
			type: String,
			required: true
		},
		holderClass: String,
		compactView: {
			type: Boolean,
			default: false
		},
		loaderState: Boolean,
		loaderItems: {
			type: Number,
			default: 4
		},
		loadingError: {
			type: Error,
			default: null
		},
	},

	computed: {
		emptyListPlaceholder() {
			const key = this.loadingError 
				? "pickup_points_loading_error_placeholder" 
				: "pickup_points_enabled_placeholder";

			return this.$t(`deliveryLabels.${key}`);
		},
	},

	methods: {
		isSelectedItem(item) {
			return this.mode === "input" || item?.hash && this.selectedOfferIds?.includes(item?.hash);
		},

		selectItem(offer) {
			this.$emit("selectItem", offer);
		},

		unselectItem(offer) {
			this.$emit("unselectItem", offer);
		},

		repeatLoading() {
			this.$emit("repeatLoading", this);
		},

		validatedValue() {
			return !!(this.items?.length);
		},
	}
}