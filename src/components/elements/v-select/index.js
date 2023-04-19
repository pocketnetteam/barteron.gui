export default {
	name: "Vselect",

	/**
	 * @param dropdown [{ text: "One", value: "1", default: true }, ...]
	 * In case of slot:dropdown
	 * <option value="1" selected>One</option>
	 */
	props: {
		id: String,
		name: String,
		align: String,
		type: String,
		size: String,

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
			items: this.dropdown ?? []
		}
	},

	computed: {
		value() {
			return this.$slots?.default[0]?.elm?.parentNode?.querySelector(this.valueSelector);
		},

		hasDropdown() {
			return this.items.length;
		}
	},

	methods: {
		/**
		 * Set value in select
		 * 
		 * @param {Object, String}
		 */
		setValue(item) {
			if (item) {
				/* Set value in select */
				this.$refs.select.value = item.value;

				/* Set value in valueSelector */
				this.value.innerHTML = item[this.dropdownItemKey] || item.text || item;
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
				const dropdowns = document.querySelectorAll('.v-select-holder.dropdown-open');

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
		 * @param {Object, String} item
		 * @param {Number, String} index
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
		if (!this.$slots.dropdown && this.dropdown.length) {
			/* Build options in select */
			this.$refs.select.innerHTML = this.dropdown
				.map(o => `
				<option value="${ o.value }"${ o.default ? 'selected' : '' }>
					${ o[this.dropdownValueKey] || o.text || o }
				</option>`
				)
				.join("\n");
		} else if(this.$slots.dropdown) {
			/* Build dropdown list from select */
			this.items = [...this.$refs.select.querySelectorAll(":scope > *")].map(o => {
				return { text: o.innerHTML, value: o.value, default: o.selected };
			});
		}

		/* Set text to value */
		this.setValue(this.items.filter(f => f.default)[0] ?? this.items[0]);

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

		/* Bind click to close dropdown */
		document.addEventListener("click", () => {
			if (this.active) this.clickSelect(null, false);
		});
	}
}