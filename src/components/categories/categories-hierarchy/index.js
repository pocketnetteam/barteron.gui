export default {
	name: "CategoriesHierarchy",

	props: {
		currentCategory: {
			type: Object,
			required: true
		},
		defaultVisibleCount: {
			type: Number,
			default: 4
		},
		open: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			expandedState: this.open,
		}
	},

	computed: {
		parentCategories(){
			return this.categories.getParentsById(this.currentCategory?.id);
		},

		subCategories() {
			return this.categories.findById(this.currentCategory?.children);
		},

		countToShow() {
			return this.subCategories.length - this.defaultVisibleCount;
		}
	},

	methods: {
		toggleExpandedState() {
			this.expandedState = !this.expandedState;
		}
	}
}