import Vue from "vue";
import Offer from "./offer.vue";

export default {
	name: "Content",

	components: {
		Offer
	},

	data() {
		return {
			deals: []
		}
	},

	async beforeRouteEnter (to, from, next) {
		const
			sdk = Vue.prototype.sdk,
			offers = await sdk.getBrtOffersByHashes([to.query?.source, to.query?.target]),
			list = await sdk.getBrtOfferComplexDeals({
				myTag: offers[0]?.tag,
				theirTags: [offers[1]?.tag],
				excludeAddresses: [offers[0]?.address]
			}),
			deals = list?.reduce((result, match) => {
				if (match?.intermediates) {
					match.intermediates.forEach(offer => {
						offer.update({ source: offers[0], target: match.target });
						result.push(offer);
					});
				}

				return result;
			}, []);

		/* Pass data to instance */
		next(vm => {
			vm.deals = deals;
		});
	}
}