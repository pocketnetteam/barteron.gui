export default {
	name: "PreviewSlide",

	inject: ["dialog"],
	
	props: {
		groupedItem: {
			type: Array,
			default: () => []
		}
	},

	methods: {
		selectItem(item) {
			this.$emit("selectItem", item);
		},
	},
}