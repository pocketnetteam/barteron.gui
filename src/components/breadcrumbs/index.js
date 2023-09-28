export default {
	name: "Breadcrumbs",

	props: {
		parent: {
			type: String,
			default: ""
		},
		target: {
			type: [Number, String, Boolean],
			default: true
		}
	},

	computed: {
		/**
		 * Generate tree of breadcrumbs
		 */
		tree() {
			const type = ["category", "barterItem"];
			let tree = [
				{
					name: "home",
					value: this.$t("pageLabels.home"),
					link: "/"
				}
			];

			/* When needs list of categories */
			if (type.includes(this.$route.matched[0].name)) {
				let
						category = this.categories.items[this.target],
						hierarchy = [];

				while(category?.id) {
					hierarchy.unshift({
						...category,
						...(this.$te(category.name) && { value: this.$t(category.name) }),
						link: { name: "category", id: category.id }
					});
					category = category.parent ? { ...this.categories.items[category.parent] } : null;
				}

				tree = tree.concat(hierarchy);
				category = hierarchy = null;
			}

			return tree;
		}
	}
}