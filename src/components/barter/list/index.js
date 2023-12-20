import BarterItem from "../item/index.vue";
import { Carousel, Slide } from "vue-carousel";

export default {
	name: "BarterList",

	components: {
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
		}
	}
}