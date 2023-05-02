import BarterList from "@/components/barter/list/index.vue";
import barters from "@/data/barters.json";

export default {
	name: "Content",

	components: {
		BarterList
	},

	data() {
		return {
			exchangeOptions: false,
			barters: barters
		}
	}
}