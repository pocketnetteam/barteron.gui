import SubCategories from "@/components/categories/sub-categories/index.vue";

export default {
	name: "Aside",

	components: {
		SubCategories
	},

	data() {
		return {
			applyDisabled: true,
			priceVariant: '-',
			lastPriceInputId: null,
			categorySelectionVariant: "categoryField",
			filtersWatcherDisabled: false,
			filters: {
				priceMin: "",
				priceMax: "",
				categorySelection: "",
				condition: []
			}
		}
	},

	inject: ["dialog"],

	computed: {
		category() {
			return this.categories.findById(this.$route.params.id);
		},

		subCategories() {
			return this.categories.findById(this.category?.children);
		}
	},

	methods: {
		setupFilters() {
			const source = this.$components.content.getFilters();

			this.filtersWatcherDisabled = true;

			this.filters.priceMin = (typeof source.priceMin === 'number') ? source.priceMin / 100 : null;
			this.filters.priceMax = (typeof source.priceMax === 'number') ? source.priceMax / 100 : null;
			this.updatePriceVariant();

			this.filters.categorySelection = source.categorySelection || "categoryField";
			this.updateCategorySelectionVariant();

			this.filters.condition = source.condition;
			//this.updateConditionVariants();
		},

		updatePriceVariant() {
			const 
				min = this.filters.priceMin || '',
				max = this.filters.priceMax || '';

			this.priceVariant = `${min}-${max}`;
		},

		updateCategorySelectionVariant(){
			this.categorySelectionVariant = this.filters.categorySelection;
		},

		// updateConditionVariants() {
		// 	this.condition = this.filters.condition;
		// },

		/**
		 * Make price fields related
		 */
		changePrice(e) {
			this.lastPriceInputId = e.target.id;

			const
				inputs = this.$refs.price?.inputs,
				minInput = inputs[0].value,
				maxInput = inputs[1].value;
			
			let
				min = (minInput != null && minInput != '') ? +minInput : null,
				max = (maxInput != null && maxInput != '') ? +maxInput : null;
			
			this.filters.priceMin = min;
			this.filters.priceMax = max;

			this.updatePriceVariant();
		},

		changePriceVariant(e) {
			const
				opt = typeof e === "string" && e.split("-"),
				min = +opt[0] || null,
				max = +opt[1] || null;

			this.filters.priceMin = min;
			this.filters.priceMax = max;

			this.lastPriceInputId = null;
		},

		onKeyUpPrice(e) {
			const filtersChanged = !this.applyDisabled;
			if (e?.keyCode === 13 && filtersChanged) {
				this.applyFilters();
			}
		},

		changeCategorySelection(e) {
			const opt = typeof e === "string" && e;
			this.filters.categorySelection = opt || "";
		},

		showCategorySelectionHelp() {
			this.dialog?.instance.view("info", this.$t("categorySelectionLabels.help_info"));
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
			let
				min = this.filters.priceMin,
				max = this.filters.priceMax;

			min = (typeof min === 'number' && min > 0) ? min : null;
			max = (typeof max === 'number' && max > 0) ? max : null;
	
			const needAdjustOfPriceValue = min && max && min > max && this.lastPriceInputId;
			if (needAdjustOfPriceValue) {
				if (this.lastPriceInputId == 'price_min') {
					max = min;
				} else if (this.lastPriceInputId == 'price_max') {
					min = max;
				}
				this.lastPriceInputId = null;

				this.filtersWatcherDisabled = true;

				this.filters.priceMin = min;
				this.filters.priceMax = max;
			}

			this.updatePriceVariant();

			this.updateCategorySelectionVariant();

			this.$components.content.applyFilters({
				...this.filters,
				priceMin: min ? min * 100 : min,
				priceMax: max ? max * 100 : max
			});

			this.applyDisabled = true;

			this.markIfNeeded();

			setTimeout(() => {
				this.hideIfNeeded();
			}, 100);
		},

		priceFilterEnabled() {
			const source = this.$components.content?.getFilters();
			return source && (source.priceMin || source.priceMax);
		},

		categorySelectionFilterEnabled() {
			const source = this.$components.content?.getFilters();
			return source && (source.categorySelection === "exchangeList");
		},

		filtersEnabled() {
			return this.priceFilterEnabled() || this.categorySelectionFilterEnabled();
		},

		resetFilters() {
			this.filtersWatcherDisabled = true;

			this.filters.priceMin = null;
			this.filters.priceMax = null;
			this.updatePriceVariant();

			this.filters.categorySelection = "categoryField";
			this.updateCategorySelectionVariant();

			this.$components.content.applyFilters({
				...this.filters,
			});

			this.applyDisabled = true;

			this.markIfNeeded();

			setTimeout(() => {
				this.hideIfNeeded();
			}, 100);
		},

		markIfNeeded() {
			const
				ref = this.$refs.asideCategories,
				value = this.filtersEnabled();

			ref?.mark(value);
		},

		hideIfNeeded() {
			const ref = this.$refs.asideCategories;
			if (ref && ref.active) {
				ref.toggle();
			}
		}
	},

	mounted() {
		this.setupFilters();

		this.$2watch("$refs.asideCategories").then(() => {
			this.markIfNeeded();
		}).catch(e => { 
			console.error(e);
		});
	},

	watch: {
		filters: {
			deep: true,
			handler() {
				if (!(this.filtersWatcherDisabled)) {
					this.applyDisabled = false;
				}
				this.filtersWatcherDisabled = false;
			}
		},
	}
}