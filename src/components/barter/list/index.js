import Loader from "@/components/loader/index.vue";
import BarterItem from "../item/index.vue";
import { Carousel, Slide } from "vue-snap";
import "vue-snap/dist/vue-snap.css";

export default {
	name: "BarterList",

	components: {
		Loader,
		BarterItem,
		Carousel,
		Slide
	},

	props: {
		items: {
			type: Array,
			default: () => []
		},
		carousel: Boolean,
		vType: {
			type: String,
			default: "tile"
		},
		customLink: {
			type: [String, Object, Function],
			default: null
		},
		loaderState: Boolean,
		loaderItems: {
			type: Number,
			default: 4
		},
		showForwardButton: {
			type: Boolean,
			default: false
		},
	},

	computed: {
		list() {
			return this.loaderState ? this.loaderItems : this.items;
		}
	},
	
	methods: {
		forwardButtonClick(e) {
			this.$emit('forwardButtonClick', e);
		}
	}
}