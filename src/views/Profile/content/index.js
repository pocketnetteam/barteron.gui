import BarterList from "@/components/barter/list/index.vue";
import Votes from "@/components/votes/index.vue";
import LikeStore from "@/stores/like.js";
import { useProfileStore } from "@/stores/profile.js";
import { mapWritableState } from "pinia";

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
		}
	},

	inject: ["dialog"],

	computed: {
		...mapWritableState(useProfileStore, [
			'bartersView',
			'activeTab',
			'activeInnerAdsTab',
		]),

		/**
		 * Get bastyon address
		 * 
		 * @returns {String}
		 */
		address() {
			return this.$route.params.id;
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
			return this.offersList
				.map(hash => this.sdk.barteron.offers[hash])
				.filter(f => f.active || f.relay)
				.sort((a, b) => {
					/* Offers with relay first */
					if (a?.relay && !b?.relay) {
						return -1;
					} else if (!a?.relay && b?.relay) {
						return 1;
					} else {
						return (b?.time || 0) - (a?.time || 0)
					}
				});
		},

		/**
		 * Inactive offers list
		 * 
		 * @returns {[@Offer, ...]}
		 */
		offersInactive() {
			return this.offersList
				.map(hash => this.sdk.barteron.offers[hash])
				.filter(f => !f.active && !f.relay)
				.sort((a, b) => (b?.time || 0) - (a?.time || 0));;
		},

		/**
		 * Active tab param
		 * 
		 * @returns {String|undefined}
		 */
		initialActiveTab() {
			return (this.$route.hash || '').replace('#','') || this.activeTab;
		},

		/**
		 * Active inner ads tab param
		 * 
		 * @returns {String|undefined}
		 */
		initialActiveInnerAdsTab() {
			return this.activeInnerAdsTab;
		},

		/**
		 * Make list of view
		 * 
		 * @returns {Array}
		 */
		views() {
			return this.parseLabels("viewLabels").map(item => {
				return { 
					...item,
					selected: item.value === this.bartersView
				}
			});
		},
	},

	methods: {
		/**
		 * Load all tabs contents based by user address
		 * 
		 * @param {String} address 
		 */
		async getTabsContent(address, options = { favorites: true }) {
			/* Start fetching */
			this.fetching = true;

			const [ published = [], pending = [] ] = await Promise.all(
				[
					/* Get published offers */
					this.sdk.getBrtOffers(address),

					/* Get pending offers */
					(this.isMyProfile ? this.sdk.getActions() : null)
				]
					.filter(r => r)
					.map(r => r.catch(e => console.error(e)))
			);

			/* Mix published and pending offers */
			this.offersList = published.map(offer => {
				/**
				 * Avoid duplicates from published and pending
				 * using "prevhash" key that appears in actions
				 * just replace offers in published with pending
				 */
				const index = pending.findIndex(o => o.prevhash === offer.hash);

				if (index > -1) {
					/* Replace old offer with new */
					offer = pending[index];
					
					/* Remove offer form pending list */
					pending.splice(index, 1);
				}

				return offer.hash;
			}).concat(pending.map(o => o.hash));
			
			/* End fetching */
			this.fetching = false;

			/* Get favorited offers */
			if (options?.favorites && this.isMyProfile && LikeStore.like?.length) {
				this.sdk.getBrtOffersByHashes(LikeStore.like).then(offers => {
					this.favoriteList = offers.map(offer => this.sdk.barteron.offers[offer.hash]);
				}).catch(e => {
					this.showError(e);
				});
			}
		},

		/**
		 * Handle active tab change
		 * 
		 * @param {String} tab
		 */
		updatePath(tab) {
			this.activeTab = tab;
			this.$router.replace({
				path: `/profile/${ this.address }`,
				hash: `#${ tab }`
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Handle active inner ads tab change
		 * 
		 * @param {String} tab
		 */
		updateActiveInnerAdsTab(tab) {
			this.activeInnerAdsTab = tab;
		},

		/**
		 * View change callback
		 * 
		 * @param {Object} view 
		 */
		selectView(view) {
			this.bartersView = view?.value;
		},

		renewOfferEvent(offer) {
			this.dialog?.instance
				.view("question", this.$t("dialogLabels.offer_renew"))
				.then(state => {
					if (state) {
						this.renewOffer(offer);
					}
				});
		},

		renewOffer(offer) {
			this.dialog?.instance.view("load", this.$t("dialogLabels.data_node"));

			/* const newOffer = new this.sdk.models.Offer({ 
				...offer,
				time: null,
				till: null,
			}); */

			offer.set({
				published: "published",
				time: null,
				till: null
			}).then(data => {
				if (data.transaction) {
					this.dialog?.instance.hide();
					this.getTabsContent(this.address, { favorites: false });
				} else {
					this.showError(
						this.$t("dialogLabels.node_error"),
						{ error: this.errorMessage(data.error?.code) }
					);
				}
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", e);
		}
	},

	watch: {
		address: {
			immediate: true,
			handler() {
				const store = useProfileStore();
				store.setAddress(this.address);

				this.getTabsContent(this.address);
			}
		},

		offersList() {
			const canToggleTabWithoutExtraSavingState = !(this.isMyProfile);

			if (canToggleTabWithoutExtraSavingState) {
				const 
					onlyInactiveOffers = (this.offersActive.length == 0 && this.offersInactive.length > 0),
					needToggleToInactive = (onlyInactiveOffers  && this.activeInnerAdsTab != 'inactive');
				
				if (needToggleToInactive) {
					this.activeInnerAdsTab = 'inactive';
				}
			}
		}
	},

	beforeRouteEnter (to, from, next) {
		next(async vm => {
			const 
				store = useProfileStore(),
				address = to?.params?.id;
			
			store.setAddress(address);

			vm.getTabsContent(address);
		});
	}
}