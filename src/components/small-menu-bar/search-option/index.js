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
			this.setFocusWithDelay(100); // without delay the focus doesn't work, nextTick also doesn't work
		},

		hideLightbox() {
			this.lightbox = false;
		},

		setFocusWithDelay(delay = 0) {
			setTimeout(() => {
				this.$refs.textField?.focus();
			}, delay);
		},

		reset() {
			this.query = "";
			this.setFocusWithDelay(0);
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