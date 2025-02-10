import offerStore from "@/stores/offer.js";

export default {
	name: "Breadcrumbs",

	props: {
		type: String,
		target: {
			type: [Number, String, Boolean],
			default: true
		},
		lastActive: Boolean
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
						link: { name: "category", params: { id: category.id } }
					});

					category = category.parent ? { ...this.categories.items[category.parent] } : null;
				}

				tree = tree.concat(hierarchy);
				category = hierarchy = null;
			}
			
			/* When needs custom page */
			if (this.type === "custom") {
				tree = tree.concat([{
					name: this.target
				}]);
			}

			return tree;
		}
	},

	methods: {
		/**
		 * Get tree item name
		 * 
		 * @param {String} name
		 * 
		 * @returns String
		 */
		getName(name) {
			return this.$te(`pageLabels.${ name }`) ? this.$t(`pageLabels.${ name }`) : this.$t(name);
		},

		itemClick() {
			// workaround: in case the route is not processed in the @/views/Category/content/index.js
			setTimeout(async () => {
				const 
					fullPath = this.$route?.fullPath,
					needReloadOffers = !(
						offerStore.loadingItemsRoute?.fullPath === fullPath
						|| offerStore.itemsRoute?.fullPath === fullPath
					);

				if (needReloadOffers) {
					await offerStore.loadFirstPage(this.$route);
				}
			}, 50);
		},
	}
}