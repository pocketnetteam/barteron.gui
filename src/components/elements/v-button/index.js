export default {
	name: "Vbutton",

	props: {
		align: String,
		type: String,
		size: String,
		dropdown: [Array, Object],
		dropdownValueKey: String
	},

	data() {
		return {
			active: false
		}
	},

	methods: {
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
				const dropdowns = document.querySelectorAll('.v-button-holder.dropdown-open');

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
		/* Bind click to close dropdown */
		document.addEventListener("click", () => {
			if (this.active) this.clickButton(null, false);
		});
	}
}