import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "SearchBar",

	components: {
		CategorySelect
	},

	computed: {
		/**
		 * Category id
		 * 
		 * @returns {Number}
		 */
		id() {
			return this.$route.name === "category" && this.$route.params.id || "";
		}
	},

	methods: {
		/**
		 * Selected category id from lightbox
		 * 
		 * @param {Number} id
		 */
		selected(id) {
			this.$router.push({ name: "category", params: { id } });
		}
	}
}