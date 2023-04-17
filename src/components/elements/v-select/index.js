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
		dropdown: [Array, Object],
		dropdownValueKey: String
	},

	data() {
		return {
			active: false,
			items: this.dropdown ?? []
		}
	},

	methods: {
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
			
			if (this.dropdown || this.$slots.dropdown) {
				this.active = active;
			}

			this.$emit("click", e, this);
		},

		/**
		 * Drop-down click handler
		 * 
		 * @param {MouseEvent} e
		 * @param {Object, String} item
		 * @param {Number, String} index
		 * @emits @selected
		 */
		clickItem(e, item, index) {
			e.preventDefault();
			e.stopPropagation();

			this.active = false;
			this.$emit("selected", item, index, this);
		}
	},

	mounted() {
		/* Build options in select or dropdown list from select */
		if (!this.$slots.dropdown && this.dropdown) {
			this.$refs.select.innerHTML = this.dropdown
				.map(o => `
				<option value="${ o.value }"${ o.default ? 'selected' : '' }>
					${ o[this.dropdownValueKey] || o.text || o }
				</option>`
				)
				.join("\n");
		} else if(this.$slots.dropdown) {
			this.gDropdown = this.this.$refs.select.children().map(o => {
				return { text: o.innerHTML, value: o.value, default: o.selected };
			});
		}

		/* Bind click to close dropdown */
		document.addEventListener("click", () => {
			if (this.active) this.clickSelect(null, false);
		});
	}
}