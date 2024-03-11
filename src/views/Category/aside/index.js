import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Aside",

	components: {
		SubCategories
	},

	data() {
		return {
			applyDisabled: true,
			filters: {
				priceMin: "",
				priceMax: "",
				condition: []
			}
		}
	},

	computed: {
		category() {
			return this.categories.findById(this.$route.params.id);
		},

		subCategories() {
			return this.categories.findById(this.category?.children);
		}
	},

	methods: {
		/**
		 * Make price fields related
		 */
		changePrice(e) {
			const
				inputs = this.$refs.price?.inputs,
				opt = typeof e === "string" && e.split("-"),
				min = opt ? (+opt[0] || null) : (+inputs[0].value || null),
				max = opt ? (+opt[1] || null) : (+inputs[1].value || null);

			this.filters.priceMin = min;
			this.filters.priceMax = max;

			if (min && max && min > max) {
				this.filters.priceMax = min;
			}
		},

		/* changeCondition(value, e) {
			this.filters.condition = this.$refs.condition.inputs
				.map(field => field.checked && field.value)
				.filter(field => field);
		}, */

		/**
		 * Send filters data to content component
		 */
		applyFilters() {
			const
				min = this.filters.priceMin,
				max = this.filters.priceMax;

			this.$components.content.applyFilters({
				...this.filters,
				priceMin: min ? min * 100 : min,
				priceMax: max ? max * 100 : max
			});

			this.applyDisabled = true;
		}
	},

	watch: {
		filters: {
			deep: true,
			handler() {
				this.applyDisabled = false;
			}
		}
	}
}