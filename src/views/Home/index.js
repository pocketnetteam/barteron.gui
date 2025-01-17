import PopularList from "@/components/categories/popular-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Banner from "@/components/banner/index.vue";
import viewedStore from "@/stores/viewed.js";
import offerStore from "@/stores/offer.js";

export default {
	name: "Home",

	components: {
		PopularList,
		BarterList,
		Banner
	},

	data() {
		return {
			fetching: true,
			newFromGoods: [],
			mayMatchExchanges: [],
			viewedList: []
		}
	},

	methods: {
		/**
		 * Get offers feed
		 */
		async getOffersFeed() {
			this.newFromGoods = await this.getOffersFeedList();
		},

		/**
		 * Show new offers
		 */
		showNewOffers() {
			offerStore.setFiltersForNewOffers();
			const route = offerStore.getRouteForNewOffers();
			this.$router.push(route);
		},

		/**
		 * Get complex deals
		 */
		async getComplexDeals() {
			if (this.address?.length) {
				/* Get my offers list */
				const myOffers = await this.sdk.getBrtOffers(this.address)
					.then(offers => offers.filter(offer => offer.active))
					.catch(e => console.error(e));
	
				/* Get potential exchange offers */
				if (myOffers?.length) {
					this.mayMatchExchanges = await Promise.all(
						myOffers.map(async offer => {
							return this.sdk.getBrtOfferComplexDeals({
								location: this.getStoredLocation() || [],
								myTag: offer.tag,
								theirTags: await this.sdk.getTheirTags(offer),
								excludeAddresses: [this.address]
							}).then(offers => {
								if (offers?.[0]?.target) {
									return offers[0].target.update({ source: offer })
								} else {
									return null;
								}
							});
						})
					).then(results => {
						return results.filter(result => result);
					}).catch(e => { 
						console.error(e);
					});
				}
			}
		},

		/**
		 * Get viewed list
		 */
		async getViewed() {
			const hashes = viewedStore.viewed;
			if (hashes?.length) {
				let offers = [];
				try {
					offers = await this.sdk.getBrtOffersByHashes(hashes);
					const sourceHashes = offers.map(item => item?.hash).filter(item => item);
					viewedStore.updateInPatchMode(sourceHashes);
				} catch (e) {
					console.error(e)
				} finally {
					this.viewedList = offers;
				}
			}
		},

		/**
		 * Reset account location
		 */
		reset() {
			this.locationStore.reset({onlyBounds: true});
		}
	},

	watch: {
		"locationStore.bounds"() {
			this.getOffersFeed();
			this.getComplexDeals();
		}
	},

	mounted() {
		this.getOffersFeed();
		this.getComplexDeals();
		this.getViewed();
	}
}