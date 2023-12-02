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
			address = await Vue.prototype.sdk.getAddress();

		if (address) {
			const
				myOffers = await Vue.prototype.sdk.getBrtOffers(address),
				exchange = myOffers?.reduce((o, offer) => {
					if (
						Number.isInteger(+offer.tag) &&
						!o.myTags.includes(offer.tag)
					) {
						o.myTags = o.myTags.concat(+offer.tag);
					}

					offer.tags?.forEach(tag => {
						if (
							Number.isInteger(+tag) &&
							!o.theirTags.includes(tag)
						) {
							o.theirTags = o.theirTags.concat(+tag);
						}
					});
	
					return o;
				}, {
					myTags: [],
					theirTags: [],
					excludeAddresses: [address]
				});

			/* Get potential exchange offers */
			if (myOffers?.length) {
				data.mayMatchExchanges = await Vue.prototype.sdk.getBrtOfferDeals(exchange);
			}
		}
		
		/* Get new offers */
		data.newFromGoods = await Vue.prototype.sdk.getBrtOffersFeed();

		/* Pass data to instance */
		next(vm => {
			for(const key in data) {
				vm[key] = data[key];
			}
		});
	}
}