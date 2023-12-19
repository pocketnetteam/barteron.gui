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
			source = await sdk.getBrtOffersByHashes([to.query?.source]).then(result => {
				console.log(result)
				return result?.pop();
			}),
			list = await sdk.getBrtOfferComplexDeals({
				myTag: source?.tag,
				theirTags: source?.tags,
				excludeAddresses: [source?.address]
			}),
			deals = list?.reduce((result, match) => {
				if (match?.intermediates) {
					match.intermediates.forEach(offer => {
						offer.update({ source, target: match.target });
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