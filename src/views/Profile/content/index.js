import BarterList from "@/components/barter/list/index.vue";

export default {
	name: "Content",

	components: {
		BarterList
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

			/* Get offers list */
			this.sdk.getBrtOffers(address).then(offers => this.offersList = offers);

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