import BarterList from "@/components/barter/list/index.vue";
import Votes from "@/components/votes/index.vue";

export default {
	name: "Content",

	components: {
		BarterList,
		Votes
	},

	data() {
		return {
			offersList: [],
			bartersView: "tile"
		}
	},

	inject: ["dialog"],

	computed: {
		/**
		 * Get bastyon address
		 * 
		 * @returns {String}
		 */
		address() {
			const address = this.$route.params.id || this.sdk.address;

			this.getTabsContent(address);

			return address;
		},

		/**
		 * Show is this profile is your's
		 * 
		 * @returns {Boolean}
		 */
		isMyProfile() {
			return this.address === this.sdk.address;
		},

		/**
		 * Active offers list
		 * 
		 * @returns {[@Offer, ...]}
		 */
		offersActive() {
			return this.offersList.filter(f => f.active);
		},

		/**
		 * Inactive offers list
		 * 
		 * @returns {[@Offer, ...]}
		 */
		offersInactive() {
			return this.offersList.filter(f => !f.active);
		},

		/**
		 * Active tab param
		 * 
		 * @returns {String|undefined}
		 */
		activeTab() {
			return this.$route.hash;
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
		 * Load all tabs contents based by user address
		 * 
		 * @param {String} address 
		 */
		async getTabsContent(address) {
			/* Get offers list */
			this.offersList = await this.sdk.getBrtOffers(address);
		},

		/**
		 * Handle active tab change
		 * 
		 * @param {String} tab
		 */
		updatePath(tab) {
			this.$router.replace({ path: `/profile/${ this.address }`, hash: `#${ tab }` }).catch(() => {});
		},

		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			this.bartersView = view?.value;
		},

		renewOffer(offer) {
			console.log(offer)
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.offer_renew"))
				.then(state => {
					console.log(state ? "yes" : "no")
				});
		}
	}
}