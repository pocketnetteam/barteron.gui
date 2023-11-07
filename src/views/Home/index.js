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
		this.mayMatchExchanges = await this.sdk.getBrtOffersFeed();
		this.newFromGoods = await this.sdk.getBrtOffersFeed();
	}
}