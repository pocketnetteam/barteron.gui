import BarterItem from "../item/index.vue";

export default {
	name: "BarterCarousel",

	components: {
		BarterItem
	},

	props: {
		items: {
			type: Array,
			default: () => []
		}
	},

	methods: {
		
	}
}