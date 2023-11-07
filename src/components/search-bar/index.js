import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "SearchBar",

	components: {
		CategorySelect
	},

	methods: {
		selected(id) {
			this.$router.push({ name: "category", params: { id } });
		}
	},
}