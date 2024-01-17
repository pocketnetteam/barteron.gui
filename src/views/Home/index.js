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

	async beforeRouteEnter (to, from, next) {
		/* Get account address if granted */
		const
			data = {},
			sdk = Vue.prototype.sdk,
			address = await sdk.getAddress(),
			account = await sdk.getBrtAccount(address);

		if (!account?.[0]) {
			account[0] = new sdk.models.Account({ address });
			sdk.setBrtAccount(account[0]);
		}

		if (address) {
			const myOffers = await sdk.getBrtOffers(address)
				.then(offers => offers.filter(offer => offer.active));
				/* exchange = myOffers?.reduce((o, offer) => {
					o.myTags.push(offer.tag);

					offer.tags?.forEach(tag => {
						if (tag === "my_list") {
							o.theirTags.concat(account?.[0].tags);
						} else {
							o.theirTags.push(tag);
						}
					});
	
					return o;
				}, { myTags: [], theirTags: [] });

			data.mayMatchExchanges = await sdk.getBrtOfferDeals(exchange); */

			/* Get potential exchange offers */
			if (myOffers?.length) {
				data.mayMatchExchanges = await Promise.all(
					myOffers.map(offer => {
						return sdk.getBrtOfferComplexDeals({
							myTag: offer.tag,
							theirTags: (() => {
								if (offer.tags?.includes("my_list")) {
									return account?.[0].tags;
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
		data.newFromGoods = await sdk.getBrtOffersFeed({
			pageSize: 100
		}).then(offers => offers.filter(offer => offer.active));

		/* Pass data to instance */
		next(vm => {
			for(const key in data) {
				vm[key] = data[key];
			}
		});
	}
}