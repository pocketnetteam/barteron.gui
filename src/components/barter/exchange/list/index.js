export default {
	name: "ExchangeList",

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
		}
	},

	data() {
		return {
			instance: this, /* Give instance to slot */
			editable: false,
			vTags: [].concat(this.tags),
			show: this.visible,
			btnAddDisabled: true,
			list: []
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
		 * Validate input value
		 * 
		 * @param {Boolean} check
		 * 
		 * @return {Boolean|Void}
		 */
		validate(check) {
			const
				input = this.$refs.tag,
				list = this.$refs.list,
				selected = document.evaluate(
					`//option[text()="${ input.value }"]`,
					list,
					null,
					XPathResult.ANY_TYPE,
					null
				)?.iterateNext();

			if (check === true) {
				/* Check is value in list range */
				return !!selected;
			} else {
				/* Fill input value from option */
				this.btnAddDisabled = true;
				input.dataset.value = "";

				if (selected) {
					this.btnAddDisabled = false;
					input.dataset.value = selected.dataset.value;
				}
			}
		},

		/**
		 * Add tag
		 */
		add() {
			const input = this.$refs.tag;
			
			if (this.validate(true) && !this.vTags.includes(input.dataset.value)) {
				this.vTags.push(input.dataset.value);
				input.value = input.dataset.value = "";
				this.btnAddDisabled = true;
			}
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
			this.$nextTick(() => {
				setTimeout(() => this.$refs.tag.focus(), 1);
			});
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
	},

	created() {
		/* Get all categories and filter 1st level of them */
		this.list = Object.keys(this.categories.items || []).filter(id => {
			const item = this.categories.items[id];

			return !item.parent && this.$te(item.name);
		}).map(id => {
			const name = this.categories.items[id].name;

			return {
				id: id,
				name: this.$t(name),
				value: name
			}
		});
	}
}