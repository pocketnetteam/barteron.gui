import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "SearchBar",

	components: {
		CategorySelect
	},

	computed: {
		currentCategory() {
			return this.$route.name === "category" && this.$route.params.id || "";
		}
	},

	methods: {
		selected(id) {
			this.$router.push({ name: "category", params: { id } });
		}
	}
}