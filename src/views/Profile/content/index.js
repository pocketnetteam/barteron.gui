import Profile from "@/components/profile/index.vue";
import Wallet from "@/components/wallet/index.vue";
import SafeDealProfile from "@/components/safe-deal/safe-deal-profile/index.vue";
import ProfileExchangeList from "@/components/barter/exchange/profile-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Votes from "@/components/votes/index.vue";
import banProcessor from "@/js/banUtils.js";
import NotificationsBanner from "@/components/notifications-banner/index.vue";
import Vue from 'vue';
import likeStore from "@/stores/like.js";
import {
	default as profileStore,
	useProfileStore
} from "@/stores/profile.js";
import {
	mapWritableState, 
	MutationType as StorageStateMutationType
} from "pinia";

export default {
	name: "Content",

	components: {
		Profile,
		Wallet,
		SafeDealProfile,
		ProfileExchangeList,
		BarterList,
		Votes
	},

	data() {
		return {
			activeTab: null,
			activeInnerAdsTab: null,
			offersList: [],
			favoriteList: [],
			fetching: null,
			isChatLoading: false,
		}
	},

	inject: ["dialog", "lightboxContainer"],

	computed: {
		...mapWritableState(useProfileStore, [
			'bartersView',
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
		 * Check if the user is a validator
		 * 
		 * @returns {Boolean}
		 */
		isValidator() {
			const settings = this.sdk.getSafeDealSettings();
			return settings.validatorAddresses.includes(this.address);
		},

		/**
		 * Active offers list
		 * 
		 * @returns {[@Offer, ...]}
		 */
		offersActive() {
			return this.offersList
				.map(hash => this.sdk.barteron.offers[hash])
				.filter(f => !(banProcessor.isBannedAddress(f.address)))
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
				.filter(f => !(banProcessor.isBannedAddress(f.address)))
				.filter(f => !f.active && !f.relay)
				.sort((a, b) => (b?.time || 0) - (a?.time || 0));
		},

		/**
		 * Offers list for votes tab
		 * 
		 * @returns {[@Offer, ...]}
		 */
		offersVoteList() {
			return [...this.offersActive, ...this.offersInactive]
				.filter(item => {
					const details = this.sdk.barteron.details[item?.hash];
					return (details?.offerScores?.length || details?.comments?.length);
				});
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
		createRoom() {
			if (this.isMyProfile) return;
			if (this.sdk.willOpenRegistration()) return;
			
			this.isChatLoading = true;
			this.dialog?.instance.view("load", this.$t("dialogLabels.opening_room"));
			this.sendMessage({
				members: [this.address],
				openRoom: true
			}).then(() => {
				this.dialog?.instance.hide();
			}).catch(e => {
				this.showError(e);
			}).finally(() => {
				this.isChatLoading = false;
			});
		},

		setupNotifications() {
			const ComponentClass = Vue.extend(NotificationsBanner);
			const instance = new ComponentClass({
				propsData: {
					viewMode: "regular",
				},
			});
			
			instance.$on('onHide', vm => {
			});

			instance.$mount();
			this.lightboxContainer().appendChild(instance.$el);
			this.$nextTick(() => {
				instance.show();
			});
		},

		/**
		 * Load all tabs contents based by user address
		 * 
		 * @param {String} address 
		 */
		async getTabsContent(address) {
			if (this.fetching?.address === address) {
				return;
			};

			/* Start fetching */
			this.fetching = { address };

			this.offersList = [];
			this.favoriteList = [];

			const [ published = [], pending = [] ] = await Promise.all(
				[
					/* Get published offers */
					this.sdk.getBrtOffers(address),

					/* Get pending offers */
					(this.isMyProfile ? this.sdk.getPendingOffers() : null)
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
				const index = pending.findIndex(o => o.firsthash === offer.hash || o.prevhash === offer.hash);

				if (index > -1) {
					/* Replace old offer with new */
					offer = pending[index];
					
					/* Remove offer form pending list */
					pending.splice(index, 1);
				}

				return offer.hash;
			}).concat(pending.map(o => o.hash));
			
			/* End fetching */
			this.fetching = null;

			/* Get favorited offers */
			this.updateFavoriteList();
		},

		/**
		 * Update favorite list
		 */
		updateFavoriteList() {
			if (this.isMyProfile) {
				const storedHashes = likeStore.like || [];
				this.sdk.getBrtOffersByHashes(storedHashes).then(offers => {
					const sourceHashes = offers.map(item => item?.hash).filter(item => item);
					likeStore.updateInPatchMode(sourceHashes);
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
			if (this.activeTab != tab) {
				this.activeTab = tab;
				this.$router.replace({
					path: `/profile/${ this.address }`,
					hash: `#${ tab }`
				}).catch(e => {
					console.error(e);
					this.showVersionConflictIfNeeded(e);
				});
			}
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
		}
	},

	watch: {
		address: {
			immediate: true,
			handler() {
				this.getTabsContent(this.address);
			}
		},

		offersList() {
			const 
				onlyInactiveOffers = (this.offersActive.length == 0 && this.offersInactive.length > 0),
				needToggleToInactive = (onlyInactiveOffers  && this.activeInnerAdsTab != 'inactive');
			
			if (needToggleToInactive) {
				this.activeInnerAdsTab = 'inactive';
			}
		},
	},

	mounted() {
		likeStore.$subscribe((mutation) => {
			if (mutation.type === StorageStateMutationType.direct) {
				this.updateFavoriteList();
			}
		});
	},

	beforeRouteEnter (to, from, next) {
		next(vm => {
			const address = to?.params?.id;
			
			vm.getTabsContent(address);
		});
	}
}