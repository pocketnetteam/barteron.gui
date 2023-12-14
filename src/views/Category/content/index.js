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
		return Vue.prototype.sdk.getBrtOfferDeals({
			...request,
			...filter,
			theirTags: [Number.isInteger(+request.theirTags) && +request.theirTags]
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
			items: []
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
		 * Order change callback
		 * 
		 * @param {Object} item 
		 */
		async selectOrder(item) {
			const state = (item?.value || "").split("_");

			filter.orderBy = state[0];
			filter.orderDesc = state[1] === "desc";

			/* Send request to node */
			this.items = await requestItems({
				theirTags: this.$route.params.id
			});
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
				theirTags: this.$route.params.id
			});
		},

		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			this.bartersView = view?.value;
		},

		/**
		 * Parse labels object from localization
		 * 
		 * @param {String} label
		 * 
		 * @returns {Array}
		 */
		parseLabels(label) {
			return Object.keys(this.$t(label)).map((value, index) => ({
				text: this.$t(`${ label }.${ value }`),
				value, default: index === 0
			}));
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
					theirTags: to.params.id
				});
			}
		}
	},

	async beforeRouteEnter (to, from, next) {
		/* Send request to node */
		const items = await requestItems({
			theirTags: to.params.id
		});

		next(vm => {
			vm.items = items;
		});
	}
}