import BarterList from "@/components/barter/list/index.vue";
import Votes from "@/components/votes/index.vue";
import LikeStore from "@/stores/like.js";

export default {
	name: "Content",

	components: {
		BarterList,
		Votes
	},

	data() {
		return {
			offersList: [],
			favoriteList: [],
			fetching: true,
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
			return this.$route.params.id || this.sdk.address;
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
		getTabsContent(address) {
			/* Get offers list */
			this.fetching = true;
			
			this.sdk.getBrtOffers(address).then(offers => {
				this.offersList = offers;
				this.fetching = false;
			});

			if (this.isMyProfile && LikeStore.like?.length) {
				this.sdk.getBrtOffersByHashes(LikeStore.like).then(offers => {
					this.favoriteList = offers;
				});
			}
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
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.offer_renew"))
				.then(state => {
					console.log(state ? "yes" : "no")
				});
		}
	},
	
	mounted() {
		this.getTabsContent(this.address);
	}
}