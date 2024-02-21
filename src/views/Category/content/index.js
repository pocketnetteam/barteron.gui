import Vue from "vue";
import BarterList from "@/components/barter/list/index.vue";

/**
 * Get items from category
 * 
 * @param {Object} request
 * 
 * @returns {Promise}
 */
const
	filter = {
		orderBy: "height", // height | location | price
		orderDesc: true
	},
	requestItems = (request) => {
		const search = request?.route?.query?.search;

		return Vue.prototype.sdk.getBrtOfferDeals({
			...filter,
			...(search && { search }),
			location: (request?.location || "") + "%",
			theirTags: Number.isInteger(+request?.id) ? [+request.id] : [],
			pageStart: request?.pageStart || 0,
			pageSize: request?.pageSize || 10
		});
	}

export default {
	name: "Content",

	components: {
		BarterList
	},

	data() {
		return {
			bartersView: "tile",
			items: [],
			pageStart: 0
		}
	},

	computed: {
		/**
		 * Make list of order by
		 * 
		 * @returns {Array}
		 */
		orders() {
			return this.parseLabels("orderLabels");
		},

		/**
		 * Make list of view
		 * 
		 * @returns {Array}
		 */
		views() {
			return this.parseLabels("viewLabels");
		}
	},

	methods: {
		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			this.bartersView = view?.value;
		},

		/**
		 * Order change callback
		 * 
		 * @param {Object} order
		 */
		async selectOrder(order) {
			const state = (order?.value || "").split("_");

			filter.orderBy = state[0];
			filter.orderDesc = state[1] === "desc";

			/* Send request to node */
			this.items = await requestItems({
				id: this.$route.params.id,
				route: this.$route,
				location: this.account?.geohash
			});

			this.pageStart = 0;
		},

		/**
		 * Get filters from aside component
		 * 
		 * @param {Object} filters
		 */
		async applyFilters(filters) {
			filter = {
				...filter,
				...filters
			}

			/* Send request to node */
			this.items = await requestItems({
				id: this.$route.params.id,
				route: this.$route,
				location: this.account?.geohash
			});

			this.pageStart = 0;
		},

		/**
		 * Load more offers
		 */
		async loadMore() {
			/* Send request to node */
			const items = await requestItems({
				id: this.$route.params.id,
				pageStart: ++this.pageStart,
				route: this.$route,
				location: this.account?.geohash
			});

			this.items = this.items.concat(items);
		}
	},

	watch: {
		/**
		 * Watch for route change and preload items
		 * 
		 * @param {Object} to
		 * @param {Object} from
		 */
		async $route(to, from) {
			if (to?.name === "category") {
				/* Send request to node */
				this.items = await requestItems({
					id: to.params.id,
					route: to,
					location: this.account?.geohash
				});
			}
		}
	},

	async beforeRouteEnter (to, from, next) {
		/* Send request to node */
		const
			sdk = Vue.prototype.sdk,
			items = await requestItems({
				id: to.params.id,
				route: to,
				location: sdk.barteron.accounts[sdk.address]?.geohash
			});

		next(vm => {
			vm.items = items;
		});
	}
}