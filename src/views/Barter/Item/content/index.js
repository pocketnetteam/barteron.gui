import BarterItem from "@/components/barter/item/index.vue";
import Feedbacks from "@/components/barter/feedbacks/index.vue";

export default {
	name: "Content",

	components: {
		BarterItem,
		Feedbacks
	},

	computed: {
		item() {
			return (Number.isInteger(this.$route.params.id) ? this.barters.items : this.sdk.barteron.offers)[this.$route.params.id];
		}
	}
}