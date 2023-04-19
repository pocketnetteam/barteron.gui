import ContentLayout from "@/components/layout/content/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import barters from "@/data/barters.json";

export default {
	name: "Content",

	components: {
		ContentLayout,
		BarterList
	},

	data() {
		return {
			barters: barters,
			value: this.$refs.value
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
			console.log(view)
		}
	}
}