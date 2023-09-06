export default {
	name: "CategoriesSelect",

	props: {
		name: {
			type: String,
			default: "category"
		}
	},

	data() {
		return {
			id: Math.random().toString(16).slice(2),
			tree: [],
			values: []
		}
	},

	methods: {
		/**
		 * Add categories to list
		 * 
		 * @param {Array} ids - Array of categories ids
		 */
		add(ids) {
			this.tree.push(
				ids
				.filter(
					id => this.categories.items[id] && this.$te(this.categories.items[id].name)
				)
				.map(id => {
					const item = this.categories.items[id];
	
					return Object.assign({
						value: this.$t(item.name)
					}, item);
				})
			)
		},

		/**
		 * Remove categories list
		 * 
		 * @param {Number} index 
		 */
		remove(index) {
			if (!this.values[index]) return;

			this.tree.splice(index || 1, this.tree.length);
			
			this.$refs.input.value = this.$refs.category[index > 1 ? index - 1 : -1]?.value || "";
			
			this.values.splice(index > 1 ? index - 1 : 0, this.values.length);
			this.$refs.category[index > 1 ? index - 1 : 0].value = "";
			this.$refs.category[index > 1 ? index - 1 : 0].dataset.value = "";
			this.$refs.category[index > 1 ? index - 1 : 0].focus();
		},

		/**
		 * Validate input value
		 * 
		 * @param {KeyboardEvent} e - onInput event
		 * @param {Number} i - input index
		 */
		validate(e, i) {
			const
				input = e.target,
				selected = this.tree[i].find(item => item.value === input.value);

			this.$refs.input.value = "";

			if (selected) {
				this.values.push(selected.value);
				input.dataset.value = selected.name;
				this.$refs.input.value = selected.name;
				this.$refs.category[i].value = selected.value;
			}

			if (selected?.children.length) {
				this.add(selected.children);
			}
		}
	},

	created() {
		/* Get all categories and filter 1st level of them */
		this.add(
			Object.keys(this.categories.items || []).filter(
				id => !this.categories.items[id].parent
			)
		);
	}
}