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
			barters: barters,
			value: this.$refs.value
		}
	},

	computed: {
		filters() {
			return Object.keys(this.$t("filterLabels")).map((value, index) => {
				return { text: this.$t(`filterLabels.${ value }`), value, default: index === 0 };
			});
		}
	},

	methods: {
		selectFilter(item) {
			console.log(item)
		}
	}
}