export default {
	name: "Vbutton",

	props: {
		vAlign: String,
		vType: String, /* ghost, stroke, bulma, gray */
		vSize: String,
		to: [String, Object],

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
			active: false
		}
	},

	computed: {
		value() {
			return this.$slots?.default[0]?.elm?.parentNode?.querySelector(this.valueSelector);
		},

		hasDropdown() {
			return this.dropdown.length || this.$slots.dropdown;
		}
	},

	methods: {
		/**
		 * Set value in button
		 * 
		 * @param {Object|String}
		 */
		setValue(item) {
			if (item) {
				/* Set value in valueSelector */
				this.value.innerHTML = item[this.dropdownItemKey] || item.text || item;
			}
		},

		/**
		 * Button click handler
		 * 
		 * @param {MouseEvent} e
		 * @emits @click
		 */
		clickButton(e, state) {
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
		}
	},

	mounted() {
		/* Set text to value */
		this.setValue(this.dropdown.filter(f => f.default)[0] ?? this.dropdown[0]);

		/* Bind click to close dropdown */
		document.addEventListener("click", () => {
			if (this.active) this.clickButton(null, false);
		});
	}
}