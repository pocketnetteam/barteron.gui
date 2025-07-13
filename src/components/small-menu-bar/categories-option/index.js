import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "CategoriesOption",

	components: {
		CategorySelect
	},

	inject: ["dialog"],

	computed: {
		id() {
			return this.$route.name === "category" && this.$route.params.id || "";
		}
	},

	methods: {
		selected(id) {
			this.$router.push({
				name: "category",
				params: { id }
			}).catch(e => {
				console.error(e);
				this.showVersionConflictIfNeeded(e);
			});
		},
	},
}