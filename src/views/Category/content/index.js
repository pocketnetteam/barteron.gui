import Vue from "vue";
import BarterList from "@/components/barter/list/index.vue";

/**
 * Get items from category
 * 
 * @param {Object} request
 * 
 * @returns {Promise}
 */
const requestItems = (request) => {
	return Vue.prototype.sdk.getBrtOffersFeed(request);
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
		 * Make list of filters
		 * 
		 * @returns {Array}
		 */
		filters() {
			return this.parseLabels("filterLabels");
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
		 * Parse labels object from localization
		 * 
		 * @param {String} label
		 * 
		 * @returns {Array}
		 */
		parseLabels(label) {
			return Object.keys(this.$t(label)).map((value, index) => {
				return { text: this.$t(`${ label }.${ value }`), value, default: index === 0 };
			});
		},

		/**
		 * Filter change callback
		 * 
		 * @param {Object} item 
		 */
		selectFilter(item) {
			console.log(item)
		},

		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			this.bartersView = view?.value;
		}
	},

	async beforeRouteEnter (to, from, next) {
		const items = await requestItems({
			tags: [Number.isInteger(+to.params.id) && +to.params.id]
		});

		next(vm => {
			vm.items = items;
		});
	}
}