import ContentLayout from "@/components/layout/content/index.vue";
import BarterList from "@/components/barter/list/index.vue";
import barters from "@/data/barters.json";

export default {
	name: "Content",

	components: {
		ContentLayout,
		BarterList
	},

	data() {
		return {
			barters: barters
		}
	}
}