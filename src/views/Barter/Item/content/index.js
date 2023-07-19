import BarterItem from "@/components/barter/item/index.vue";

export default {
	name: "Content",

	components: {
		BarterItem
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