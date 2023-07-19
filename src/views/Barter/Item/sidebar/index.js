import BarterExchange from "@/components/barter/exchange/index.vue";
import Profile from "@/components/profile/index.vue";
import ExchangeList from "@/components/barter/exchange/list/index.vue";

export default {
	name: "Sidebar",

	components: {
		BarterExchange,
		Profile,
		ExchangeList
	},

	data() {
		return {
			item: {}
		}
	},

	mounted() {
		this.item = this.routeComponents?.default?.item;
	}
}