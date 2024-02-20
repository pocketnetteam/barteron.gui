import BarterItem from "@/components/barter/item/index.vue";
import Votes from "@/components/votes/index.vue";

export default {
	name: "Content",

	components: {
		BarterItem,
		Votes
	},

	computed: {
		item() {
			return this.sdk.barteron.offers[this.$route.params.id];
		}
	}
}