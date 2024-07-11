import Vue from "vue";
import BarterList from "@/components/barter/list/index.vue";

/**
 * Get items from category
 * 
 * @param {Object} request
 * 
 * @returns {Promise}
 */
let filter = {
	orderBy: "height", // height | location | price
	orderDesc: true
};

const defaultPageSize = 12;

const requestItems = (request) => {
	const
		mixin = Vue.prototype.shared,
		search = request?.route?.query?.search;

	return Vue.prototype.sdk.getBrtOfferDeals({
		...filter,
		...(search && { search: `%${ search }%` }),
		location: mixin.computed.locationStore().near || [],
		theirTags: Number.isInteger(+request?.id) ? [+request.id] : [],
		pageStart: request?.pageStart || 0,
		pageSize: request?.pageSize || defaultPageSize
	});
};

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
		 * Make page size
		 * 
		 * @returns {Number}
		 */
		pageSize() {
			return defaultPageSize;
		},

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
			this.setOrderInFilter(order);
			await this.loadFirstPage();
		},

		/**
		 * Set order value in filter
		 * 
		 * @param {Object} order
		 */
		setOrderInFilter(order) {
			const state = (order?.value || "").split("_");

			filter.orderBy = state[0];
			filter.orderDesc = state[1] === "desc";
		},

		/**
		 * Get order value from filter
		 * 
		 * @returns {String}
		 */
		getOrderFromFilter() {
			const
				orderBy = filter.orderBy ?? 'height',
				orderArrow = filter.orderDesc ? 'desc' : 'asc';
				
			return `${orderBy}_${orderArrow}`;
		},

		/**
		 * Set order value in element
		 */
		setOrderValue() {
			const
				targetValue = this.getOrderFromFilter(),
				items = this.$refs.order?.items || [],
				targetItem = items.filter(item => item.value === targetValue)[0];

			if (targetItem) {
				this.$refs.order.setValue(targetItem);
			}
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

			await this.loadFirstPage();
		},

		/**
		 * Current filters
		 * 
		 * @returns {Object}
		 */
		getFilters() {
			return filter;
		},

		/**
		 * Load first page
		 * 
		 * @param {Object} request 
		 */
		async loadFirstPage(inputRoute) {
			
			this.pageStart = 0;

			const 
				route = inputRoute ?? this.$route,
				data = {
					id: route.params.id,
					route,
					pageStart: this.pageStart
				};

			this.items = await requestItems(data);
		},

		/**
		 * Load more offers
		 */
		async loadMore() {
			/* Send request to node */
			const items = await requestItems({
				id: this.$route.params.id,
				pageStart: (this.pageStart + 1),
				route: this.$route
			});

			this.pageStart++;
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
				await this.loadFirstPage(to);
			}
		},

		async "LocationStore.geohash"() {
			await this.loadFirstPage();
		}
	},

	mounted() {
		this.$2watch("$refs.order").then(() => {
			this.setOrderValue();
		});
	},

	beforeRouteEnter (to, from, next) {
		next(async vm => {
			await vm.loadFirstPage(to);
		});
	}	
}