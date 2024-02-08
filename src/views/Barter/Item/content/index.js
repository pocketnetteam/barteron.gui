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
			return (Number.isInteger(this.$route.params.id) ? this.barters.items : this.sdk.barteron.offers)[this.$route.params.id];
		},

		details() {
			return this.sdk.barteron.details[this.item?.hash];
		}
	}
}