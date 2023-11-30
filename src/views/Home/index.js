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
		/* Get account address if granted */
		const address = await this.sdk.getAddress();

		if (address) {
			const
				myOffers = await this.sdk.getBrtOffers(address),
				exchange = myOffers?.reduce((o, offer) => {
					if (
						!o.myTags.includes(offer.tag) &&
						Number.isInteger(parseInt(offer.tag))
					) o.myTags = o.myTags.concat(offer.tag);

					offer.tags?.forEach(tag => {
						if (
							!o.theirTags.includes(tag) &&
							Number.isInteger(parseInt(offer.tag))
						) o.theirTags = o.theirTags.concat(tag);
					});
	
					return o;
				}, { myTags: [], theirTags: [] });

			/* Get potential exchange offers */
			this.mayMatchExchanges = await this.sdk.getBrtOfferDeals(exchange);
		}
		
		/* Get new offers */
		this.newFromGoods = await this.sdk.getBrtOffersFeed();
	}
}