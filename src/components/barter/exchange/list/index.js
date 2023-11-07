import CategorySelect from "@/components/categories/select/index.vue";

export default {
	name: "ExchangeList",

	components: {
		CategorySelect
	},

	props: {
		tags: {
			type: Array,
			default: () => [
				"electronics",
				"belts",
				"shoes",
				"beauty_personal_care",
				"sports"
			]
		},
		visible: {
			type: Number,
			default: 5
		},
		title: {
			type: Boolean,
			default: true
		},
		vSize: {
			type: String,
			default: "md"
		}
	},

	data() {
		return {
			instance: this, /* Give instance to slot */
			id: Math.random().toString(16).slice(2),
			editable: false,
			vTags: [].concat(this.tags),
			show: this.visible
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
			if (!this.isExist(id)) this.vTags.push(id);
		},

		/**
		 * Remove tag
		 * 
		 * @param {Number} index
		 */
		remove(index) {
			this.vTags.splice(index, 1);
		},

		/**
		 * Edit state
		 */
		edit() {
			this.editable = true;
		},

		/**
		 * Cancel state
		 */
		cancel() {
			this.vTags = [].concat(this.tags);
			this.editable = false;
		},

		/**
		 * Save state
		 */
		save() {
			this.editable = false;
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