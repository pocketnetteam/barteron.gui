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
		 * Import children list
		 * 
		 * @param {Array[String]} ids 
		 */
		importChildren(ids) {
			return ids
				.filter(
					id => this.categories.items[id] && this.$te(this.categories.items[id].name)
				)
				.map(id => {
					const item = this.categories.items[id];
	
					return Object.assign({
						value: this.$t(item.name)
					}, item);
				});
		},

		/**
		 * Add categories to list
		 * 
		 * @param {Array[String]} ids - Array of categories ids
		 * 
		 * @return {this}
		 */
		add(ids) {
			this.tree.push(this.importChildren(ids));

			return this;
		},

		/**
		 * Remove categories list
		 * 
		 * @param {Number} index
		 * 
		 * @return {this}
		 */
		remove(index) {
			if (index && !this.values[index]) return;

			this.tree.splice(index || 1, this.tree.length);
			
			this.$refs.input.value = this.$refs.category[index > 1 ? index - 1 : -1]?.id || "";
			
			this.values.splice(index > 1 ? index - 1 : 0, this.values.length);
			this.$refs.category[index > 1 ? index - 1 : 0].value = "";
			this.$refs.category[index > 1 ? index - 1 : 0].dataset.value = "";
			if (index) this.$refs.category[index > 1 ? index - 1 : 0].focus();

			return this;
		},

		/**
		 * Add tree reversed-recursively
		 * 
		 * @param {String} id
		 * 
		 * @return {this}
		 */
		value(id) {
			let category = this.categories.items[id];

			if (id && category?.name) {
				const tree = [];
				this.values = [id];

				while(category.parent) {
					category = { ...this.categories.items[category.parent] };

					if (category?.children?.length) {
						category.children = this.importChildren(category.children);

						tree.unshift(category.children);
						this.values.unshift(category.id);
					}
				}
				
				this.tree = this.tree.concat(tree);
			}

			this.$nextTick(() => {
				this.values.forEach((id, index) => {
					const input = this.$refs.category[index];
					
					input.dataset.value = id;
					input.value = this.$te(this.categories.items[id].name) && this.$t(this.categories.items[id].name);
				});

				this.$refs.input.value = id;
			});

			category = null;

			return this;
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
				input.dataset.value = selected.id;
				this.$refs.input.value = selected.id;
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