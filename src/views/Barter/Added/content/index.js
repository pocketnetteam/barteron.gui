import BarterList from "@/components/barter/list/index.vue";

export default {
	name: "Content",

	components: {
		BarterList
	},

	computed: {
		offer() {
			return this.sdk.barteron.offers[this.$route.params.id];
		}
	},

	data() {
		return {
			exchangeOptions: false
		}
	}
}