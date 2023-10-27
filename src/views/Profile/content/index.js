import BarterList from "@/components/barter/list/index.vue";
import Feedbacks from "@/components/barter/feedbacks/index.vue";

export default {
	name: "Content",

	components: {
		BarterList,
		Feedbacks
	},

	data() {
		return {
			offersList: [],
			bartersView: "tile"
		}
	},

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @return {String}
		 */
		address() {
			const address = this.$route.params.id || this.sdk.address;

			this.getTabsContent(address);

			return address;
		},

		/**
		 * Show is this profile is your's
		 * 
		 * @return {Boolean}
		 */
		isMyProfile() {
			return this.address === this.sdk.address;
		},

		/**
		 * Active tab param
		 * 
		 * @return {String|undefined}
		 */
		activeTab() {
			return this.$route.hash;
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
		 * Load all tabs contents based by user address
		 * 
		 * @param {String} address 
		 */
		async getTabsContent(address) {
			/* Get offers list */
			this.offersList = await this.sdk.getBrtOffers(address);
		},

		/**
		 * Parse labels object from localization
		 * 
		 * @param {String} label
		 * 
		 * @return {Array}
		 */
		parseLabels(label) {
			return Object.keys(this.$t(label)).map((value, index) => {
				return { text: this.$t(`${ label }.${ value }`), value, default: index === 0 };
			});
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