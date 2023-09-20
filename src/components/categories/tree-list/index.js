import TreeList from "./index.vue";

export default {
	name: "TreeList",

	components: {
		TreeList
	},

	props: {
		items: {
			type: Array,
			default: () => []
		},
		parents: {
			type: Array,
			default: () => []
		}
	},

	computed: {
		/**
		 * Detect if tree has active elements
		 * 
		 * @return {Array}
		 */
		subOpened() {
			return this.items.filter(f => f.active);
		}
	},

	methods: {
		/**
		 * Create parents history for given child
		 * 
		 * @param {Object} item
		 * @return {Array}
		 **/
		parentsList(item) {
			return this.parents.concat(item);
		},

		/**
		 * Get each item clicked
		 * if item inside parents so emitting event up
		 * 
		 * @param {MouseEvent} e
		 * @param {Object} item
		 * @param {Number} index
		 * @emits selectItem
		 **/
		selectItem(e, item, index) {
			e.stopPropagation(); /* Prevent click propagation to parents */
			
			/* Make clicked item active */
			if (this.items[index]?.name === item.name && item.children?.length) {
				/* Load sub-categories on demand */
				if (!item.children[0]?.name) item.children = this.categories.findById(item.children);

				/* Set parent to active state (opened) */
				this.$set(this.items[index], "active", !this.items[index].active ?? true);
			}

			/* If last item (without children) clicked */
			if (!item.children?.length) {
				/* Remove active flag */
				this.subOpened.forEach(entry => {
					const index = this.items.indexOf(entry);
					this.$delete(this.items[index], "active");
				});

				/* Set parents to item */
				if (!item.parents) {
					item.parents = this.parents;
				}

				/* Call itemSelected when at upper level of tree */
				if (!this.parents?.length) {
					this.itemSelected(item);
				}
			}

			this.$emit('selectItem', e, item, index);
		},

		/**
		 * Final item selection
		 * that not contains children
		 * if item inside parents so emitting event up
		 * 
		 * @param {Object} item
		 * @emits itemSelected
		 **/
		itemSelected(item, index) {
			this.$emit('itemSelected', item, this.$parent);
		}
	}
}