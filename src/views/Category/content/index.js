import BarterList from "@/components/barter/list/index.vue";

export default {
	name: "Content",

	components: {
		BarterList
	},

	data() {
		return {
			bartersView: "tail"
		}
	},

	computed: {
		/**
		 * Make list of filters
		 * 
		 * @return {Array}
		 */
		filters() {
			return this.parseLabels("filterLabels");
		},

		/**
		 * Make list of view
		 * 
		 * @return {Array}
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
		 * @return {Array}
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
	}
}