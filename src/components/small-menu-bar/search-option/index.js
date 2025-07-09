export default {
	name: "SearchOption",

	data() {
		return {
			lightbox: false,
			query: this.$route.query.search || "",
		}
	},

	computed: {
		id() {
			return this.$route.name === "category" && this.$route.params.id || "";
		}
	},

	methods: {
		showLightbox() {
			this.query = this.$route.query.search || "";
			this.lightbox = true;
			
			setTimeout(() => {
				this.$refs.textField?.focus();
			}, 100);
		},

		hideLightbox() {
			this.lightbox = false;
		},

		reset() {
			this.query = "";
		},

		applyButtonEnabled() {
			return (this.$route.query.search || "") !== (this.query || "");
		},

		submit() {
			this.hideLightbox();
			
			const
				to = {
					name: "category",
					params: { id: this.id || "search" },
					query: this.query ? { search: this.query } : {},
				},
				from = this.$route,
				needReplace = !(this.routesAreEqual(to, from, ['name', 'params', 'query']));

			if (needReplace) {
				this.$router.replace(to).catch(e => {
					console.error(e);
				});
			};
		},
	},

	watch: {
		async $route(to, from) {
			this.query = to.query.search || ""
		},
	},
}