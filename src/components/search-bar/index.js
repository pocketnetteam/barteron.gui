import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "SearchBar",

	components: {
		CategorySelect
	},

	data() {
		return {
			query: this.$route.query.search || ""
		}
	},

	inject: ["dialog"],

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
			this.$router.push({
				name: "category",
				params: { id }
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Reset search query
		 */
		reset() {
			this.query = "";
		},

		/**
		 * Store search string in url query
		 */
		submit() {
			this.$router.replace({
				name: "category",
				params: { id: this.id || "search" },
				query: { search: this.query }
			}).catch(e => {
				this.showError(e);
			});
		},

		/**
		 * Show error
		 * 
		 * @param {Object} e
		 */
		showError(e) {
			this.dialog?.instance.view("error", this.sdk.errorMessage(e));
		},
	},

	watch: {
		async $route(to, from) {
			this.query = to.query.search || ""
		},

		query: {
			handler() {
				const queryReset = (!this.query && this.$route.query.search);
				if (queryReset) {
					this.submit()
				}
			}
		}
	}
}