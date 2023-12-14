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
		changePrice() {
			const
				inputs = this.$refs.price?.inputs,
				min = +inputs[0].value || "",
				max = +inputs[1].value || "";

			this.filters.priceMin = min;
			this.filters.priceMax = max;
			
			if (min && max && min > max) {
				this.filters.priceMax = min;
			}

			if (!min && max) {
				this.filters.priceMin = max;
			}
		},

		changeCondition(value, e) {
			this.filters.condition = this.$refs.condition.inputs
				.map(field => field.checked && field.value)
				.filter(field => field);
		},

		/**
		 * Send filters data to content component
		 */
		applyFilters() {
			this.$components.content.applyFilters({
				...this.filters,
				priceMin: +this.filters.priceMin,
				priceMax: +this.filters.priceMax
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