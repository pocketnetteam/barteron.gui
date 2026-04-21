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

		isTopCategory(item) {
			return item.type === "category" && !(item.parent);
		},

		isSubcategory(item) {
			return item.type === "category" && item.parent;
		},

		getPadding(item) {
			const values = {
				12: "12px",
				281: "9px",
				888: "11px",
				2000: "4px",
				3000: "4px",
				8000: "8px",
				10542: "5px",
				11700: "2px",
				6000: "0px",

			};
			return values[item.key] || "10px";
		},
	},
}