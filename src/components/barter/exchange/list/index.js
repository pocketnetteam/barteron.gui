import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "ExchangeList",

	components: {
		CategorySelect
	},

	props: {
		tags: {
			type: Array,
			default: () => []
		},
		visible: {
			type: Number,
			default: 5
		},
		title: {
			type: [Boolean, String],
			default: true
		},
		vSize: {
			type: String,
			default: "md"
		},
		editable: Boolean,
		editMode: Boolean,
		holderClass: String,
		editText: {
			type: String,
			default: "<i class='fa fa-pencil-alt fa-shrink'></i>"
		},
		cancelText: {
			type: String,
			default: "<i class='fa fa-times fa-shrink'></i>"
		},
		saveText: {
			type: String,
			default: "<i class='fa fa-check fa-shrink'></i>"
		},
		categorySelectTitle: {
			type: String,
			default: ""
		}
	},

	data() {
		return {
			instance: this, /* Give instance to slot */
			id: Math.random().toString(16).slice(2),
			editing: this.editMode,
			vTags: [].concat(this.tags),
			show: this.visible || this.tags.length
		}
	},

	methods: {
		/**
		 * Toggle items to see
		 */
		toggle() {
			if (this.show < this.vTags.length) {
				this.show = this.vTags.length;
			} else {
				this.show = this.visible;
			}
		},

		/**
		 * Check is given id already added
		 * 
		 * @param {Number|String} id
		 * 
		 * @returns {Boolean}
		 */
		isExist(id) {
			return this.vTags.some(t => Number(t) === Number(id));
		},

		/**
		 * Insert tag to list
		 */
		insert(id) {
			if (!this.isExist(id)) {
				this.vTags.push(id);
				
				if (this.editMode) {
					this.$emit('change', this.vTags);
				}
			}
		},

		/**
		 * Remove tag
		 * 
		 * @param {Number} index
		 */
		remove(index) {
			this.vTags.splice(index, 1);

			if (this.editMode) {
				this.$emit('change', this.vTags);
			}
		},

		/**
		 * Edit state
		 */
		edit() {
			this.editing = true;
		},

		/**
		 * Cancel state
		 */
		cancel() {
			this.vTags = [].concat(this.tags);
			this.editing = this.editMode;
		},

		/**
		 * Save state
		 */
		save() {
			this.editing = this.editMode;
			this.$emit('change', this.vTags);
		}
	},

	watch: {
		/**
		 * Watch for lazy loading of tags
		 * 
		 * @param {Array} tags
		 */
		tags(tags) {
			this.vTags = [].concat(tags);
		}
	}
}