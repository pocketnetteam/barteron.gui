import PopularList from "@/components/categories/popular-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Banner from "@/components/banner/index.vue";
import ViewedStore from "@/stores/viewed.js";

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
		 * Get complex deals
		 */
		async getComplexDeals() {
			if (this.address?.length) {
				/* Get my offers list */
				const myOffers = await this.sdk.getBrtOffers(this.address)
					.then(offers => offers.filter(offer => offer.active));
	
				/* Get potential exchange offers */
				if (myOffers?.length) {
					this.mayMatchExchanges = await Promise.all(
						myOffers.map(offer => {
							return this.sdk.getBrtOfferComplexDeals({
								location: this.locationStore.near || [],
								myTag: offer.tag,
								theirTags: (() => {
									if (offer.tags?.includes("my_list")) {
										return this.account?.tags;
									} else {
										return offer.tags;
									}
								})(),
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
					});
				}
			}
		},

		/**
		 * Get viewed list
		 */
		async getViewed() {
			if (ViewedStore.viewed?.length) {
				const viewed = await this.sdk.getBrtOffersByHashes(ViewedStore.viewed);
				
				this.viewedList = ViewedStore.viewed.map(hash => {
					const index = viewed.findIndex(offer => offer?.hash === hash);

					return viewed[index];
				});
			}
		},

		/**
		 * Reset account location
		 */
		reset() {
			this.locationStore.reset();
		}
	},

	watch: {
		"locationStore.geohash"() {
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