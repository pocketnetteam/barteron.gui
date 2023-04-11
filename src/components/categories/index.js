import { Object } from "core-js";
import TreeList from "./tree-list/index.vue";

export default {
	name: "Categories",

	components: {
		TreeList
	},

	props: {
		categories: {
			type: Object,
			default: () => []
		}
	},

	data() {
		return {
			overlay: false,
			items: (() => {
				return Object.keys(this.categories).filter(f => !this.categories[f].parent).map(id => {
					return Object.assign({ id: id }, this.categories[id]);
				});
			})()
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