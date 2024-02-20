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
			this.fetching = true;

			this.newFromGoods = await this.sdk.getBrtOffersFeed({
				location: (this.account?.geohash || "") + "%",
				pageSize: 100
			}).then(offers => {
				this.fetching = false;
				return offers.filter(offer => offer.active);
			});
		},

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
								location: (this.account?.geohash || "") + "%",
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
				this.viewedList = await this.sdk.getBrtOffersByHashes(ViewedStore.viewed);
			}
		}
	},

	watch: {
		"account.geohash"() {
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