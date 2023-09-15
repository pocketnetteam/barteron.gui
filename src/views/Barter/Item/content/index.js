import BarterItem from "@/components/barter/item/index.vue";

export default {
	name: "Content",

	components: {
		BarterItem
	},

	computed: {
		item() {
			return this.sdk.barteron.offers[this.$route.params.id]
		}
	}
}