export default {
	name: "Vselect",

	/**
	 * @param dropdown [{ text: "One", value: "1", selected: true }, ...]
	 * In case of slot:dropdown
	 * <option value="1" selected>One</option>
	 */
	props: {
		id: String,
		name: String,
		disabled: [String, Boolean],
		vAlign: String,
		vType: String,
		vSize: String,

		dropdown: {
			type: Array,
			default: () => []
		},
		valueSelector: {
			type: String,
			default: ".value"
		},
		dropdownItemKey: {
			type: String,
			default: "text"
		}
	},

	data() {
		return {
			active: false,
			value: null,
			selected: null,
			options: []
		}
	},

	computed: {
		/**
		 * Get instance of class
		 * 
		 * @returns {@Vselect}
		 */
		instance() {
			return this;
		},

		/**
		 * Build list of options
		 * 
		 * @returns {Array}
		 */
		items() {
			const dropdown = this.dropdown;

			this.$nextTick(() => {
				if (!this.$refs.select) return;

				/* Create innerWidth method of select computed styles */
				const computed = Object.defineProperties(
					getComputedStyle(this.$refs.select),
					{
						innerWidth: {
							get() {
								const exclude = ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"];

								return exclude.reduce((w, p) => {
									w -= parseInt(this[p]);
									return w;
								}, parseInt(this.width));
							}
						}
					}
				);
				
				this.$refs.button.style.setProperty('--min-width', `${ computed.innerWidth }px`);
			});

			if (dropdown.length) {
				/* Set text to value */
				if (!this.selected) this.setValue(dropdown.filter(f => f.selected)[0] ?? dropdown[0]);
			}

			return dropdown;
		},

		/**
		 * Is dropdown available
		 * 
		 * @returns {Number}
		 */
		hasDropdown() {
			return this.items.length;
		}
	},

	methods: {
		/**
		 * Set value in select
		 * 
		 * @param {Object|String}
		 */
		setValue(item) {
			if (item) {
				/* Set value in select */
				this.selected = item.value;

				/* Set value in valueSelector */
				this.value = item[this.dropdownItemKey] || item.text || item;
			}
		},

		/**
		 * Select click handler
		 * 
		 * @param {MouseEvent} e
		 * @emits @click
		 */
		clickSelect(e, state) {
			e?.preventDefault();
			e?.stopPropagation();

			const active = state ?? !this.active;

			/* Disable dropdowns of other buttons */
			if (e) {
				const dropdowns = document.querySelectorAll('.dropdown-open');

				if (dropdowns.length) {
					document.body.click();
				}
			}
			
			if (this.hasDropdown) {
				this.active = active;
			}

			this.$emit("click", e, this);
		},

		/**
		 * Drop-down item click handler
		 * 
		 * @param {MouseEvent} e
		 * @param {Object|String} item
		 * @param {Number|String} index
		 * 
		 * @emits @selected
		 */
		clickItem(e, item, index) {
			e.preventDefault();
			e.stopPropagation();

			/* Deactivate dropdown */
			this.active = false;

			/* Set text to value */
			this.setValue(item);

			/* Emit item clicked */
			this.$emit("selected", item, index, this);
		},

		/**
		 * Updating button title (in case of locale change)
		 * 
		 * @returns {Void}
		 */
		updateButton() {
			this.$nextTick(() => {
				const items = this.$props.dropdown || [];
				const currentItem = items.filter(f => f.selected).pop();
				if (currentItem) {
					this.setValue(currentItem);
				}
			});
		}
	},

	mounted() {
		/* Bind click to close dropdown */
		document.addEventListener("click", () => {
			if (this.active) this.clickSelect(null, false);
		});
	}
}