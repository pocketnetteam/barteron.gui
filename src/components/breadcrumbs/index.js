export default {
	name: "Breadcrumbs",

	props: {
		parent: [String, Array]
	},

	computed: {
		matches() {
			const match = [];

			switch(this.$route.matched[0].name) {
				case "category": {
					/* Add category parents to breadcrumbs */
					let
						page = this.categories.findByName(this.$route.params.slug),
						cat = page;
					
					/* Add parent to breadcrumbs */
					while (cat.parent) {
						cat = this.sub(cat.id ? cat : this.$route.params.slug);
						match.push(
							this.path(cat, "/category")
						);
					}

					/* Add category to breadcrumbs */
					match.reverse().push(
						this.path(page, "/category")
					);

					page = cat = null;

					break;
				}
			}
			
			if (this.parent) {
				return this.getParents().concat(match);
			}

			return match;
		}
	},

	methods: {
		/**
		 * Get parents by name
		 * 
		 * @return {Array}
		 */
		getParents() {
			return this.$router.options.routes.filter(f => {
				if (Array.isArray(this.parent)) {
					return this.parent.find(name => name === f.name);
				} else {
					return f.name === this.parent;
				}
			});
		},

		/**
		 * Get sub-categories
		 * 
		 * @param {String} name
		 * @return {Object}
		 */
		sub(name) {
			const category = name.id ? name : this.categories.findByName(name);

			return this.categories.findById(category.parent);
		},

		/**
		 * Add path to page
		 * 
		 * @param {*} page
		 * @return {Object}
		 */
		path(page, path) {
			return Object.assign({
				to: `${ path }/${ page.name }`
			}, page);
		}
	}
}