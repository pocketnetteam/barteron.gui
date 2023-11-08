import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "CategoryField",

	components: {
		CategorySelect
	},

	props: {
		name: {
			type: String,
			default: "category"
		},

		value: {
			type: [Number, String],
			default: null
		}
	},

	data() {
		return {
			id: null
		}
	},

	computed: {
		/**
		 * Get category parents
		 * 
		 * @returns {Array}
		 */
		catParents() {
			const select = this.$refs.categorySelect;

			return this?.id ? select?.getParents(this.id) : [];
		}
	},

	methods: {
		/**
		 * Clear field
		 */
		clear() {
			this.id = null;
		},

		/**
		 * Selected category id from lightbox
		 * 
		 * @param {Number} id
		 */
		selected(id) {
			this.id = id;
		}
	},

	watch: {
		/**
		 * Watch for value changes
		 * 
		 * @param {Number|String} id
		 */
		value(id) {
			this.id = id;
		}
	}
}