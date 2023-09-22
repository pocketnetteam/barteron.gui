export default {
	name: "Breadcrumbs",

	props: {
		parent: {
			type: String,
			default: ""
		},
		target: {
			type: [String, Boolean],
			default: true
		}
	},

	computed: {
		/**
		 * Generate tree of breadcrumbs
		 */
		tree() {
			const type = ["category", "barterItem"];
			let tree = ["home"];

			/* When needs list of categories */
			if (type.includes(this.$route.matched[0].name)) {
				/* When target is set */
				if (typeof this.target === "string") {
					let
						category = this.categories.items[this.target],
						hierarchy = [];

					while(category.parent) {
						hierarchy.unshift(category.name);
						category = { ...this.categories.items[category.parent] };
					}

					tree = tree.concat(hierarchy);
					category = hierarchy = null;
				}
			}

			return tree;
		}
	}
}