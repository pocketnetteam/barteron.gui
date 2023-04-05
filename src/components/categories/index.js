import TreeList from "./tree-list/index.vue";

export default {
	name: "Categories",

	components: {
		TreeList
	},

	props: {
		categories: {
			type: Array,
			default: () => []
		}
	},

	data() {
		return {
			overlay: false,
			items: this.categories
		}
	},

	methods: {
		/**
		 * Toggle overlay and emit up event
		 * 
		 * @param {MouseEvent} e
		 * @param {Class} instance
		 */
		categoriesToggle(e, instance) {
			this.overlay = instance.active;
			this.$emit("categoriesToggle", instance);
		},

		/**
		 * Item selected
		 * 
		 * @param {Object} item 
		 * @param {Object} button 
		 */
		categorySelected(item, button) {
			/* Hide drop-down and overlay */
			button.clickButton(null, false);

			this.$emit("categorySelected", item, button);
		}
	}
}