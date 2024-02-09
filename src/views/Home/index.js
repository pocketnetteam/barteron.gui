import Vue from "vue";
import PopularList from "@/components/categories/popular-list/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import Banner from "@/components/banner/index.vue";

export default {
	name: "Home",

	components: {
		PopularList,
		BarterList,
		Banner
	},

	data() {
		return {
			mayMatchExchanges: [],
			newFromGoods: []
		}
	},

	async mounted() {
		const
			address = this.sdk.address,
			account = this.sdk.barteron.accounts[address];

			if (address?.length) {
				/* Get my offers list */
				const myOffers = await this.sdk.getBrtOffers(address)
					.then(offers => offers.filter(offer => offer.active));
	
				/* Get potential exchange offers */
				if (myOffers?.length) {
					this.mayMatchExchanges = await Promise.all(
						myOffers.map(offer => {
							return this.sdk.getBrtOfferComplexDeals({
								myTag: offer.tag,
								theirTags: (() => {
									if (offer.tags?.includes("my_list")) {
										return account?.tags;
									} else {
										return offer.tags;
									}
								})(),
								excludeAddresses: [address]
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
			
			/* Get new offers */
			this.newFromGoods = await this.sdk.getBrtOffersFeed({
				pageSize: 100
			}).then(offers => offers.filter(offer => offer.active));
	}
}