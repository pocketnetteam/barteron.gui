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

			this.fetching = { address };

			this.offersList = [];
			this.favoriteList = [];

			try {
				const 
					publishedOffers = await this.sdk.getBrtOffers(address),
					applyPendingActions = this.isMyProfile,
					pendingOffers = [];

				if (applyPendingActions) {
					const pendingActions = await this.sdk.getOfferActions({pending: true}).catch(e => {
						console.error(e);
					});

					const 
						objectType = this.sdk.txTypes.contentDelete.name,
						deletionActions = (pendingActions || []).filter(f => (f?.expObject?.type === objectType)),
						editionActions =  (pendingActions || []).filter(f => (f?.expObject?.type !== objectType));
					
					const missingHashes = deletionActions
						.map(m => m?.expObject?.txidEdit)
						.filter(f => f && !(this.sdk.barteron.offers[f]));

					await this.sdk.getBrtOffersByHashes(missingHashes);

					deletionActions.forEach(f => {
						const 
							hash = f?.expObject?.txidEdit,
							existingOffer = this.sdk.barteron.offers[hash];
						
						if (existingOffer) {
							const offer = new this.sdk.models.Offer({
								...existingOffer,
								published: "removed",
								relay: true,
							});
							pendingOffers.push(offer);
						};
					});

					editionActions.forEach(f => {
						const 
							expObject = f.expObject,
							hash = (expObject.hash || f.transaction);

						if (expObject) {
							const offer = new this.sdk.models.Offer({
								...expObject,
								hash,
								price: expObject?.price / 100,
								relay: true,
							});
							pendingOffers.push(offer);
						};
					});
				};

				const 
					publishedOfferHashes = publishedOffers.map(m => m.hash),
					pendingOfferHashes = pendingOffers.map(m => m.hash),
					addingOfferHashes = pendingOfferHashes.filter(f => !(publishedOfferHashes.includes(f)));
				
				this.offersList = publishedOfferHashes.concat(addingOfferHashes);
			} catch (e) {
				this.showError(e);
			} finally {
				this.fetching = null;
			};

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