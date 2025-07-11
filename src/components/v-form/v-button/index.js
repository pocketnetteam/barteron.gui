export default {
	name: "Vbutton",

	props: {
		disabled: [String, Boolean],
		title: String,
		vAlign: String,	/* right */
		vType: String,	/* ghost, stroke, bulma, gray */
		vSize: String,	/* xs, sm, md, lg, xl */
		to: [String, Object],

		vText: String,
		vHtml: String,

		dropdown: {
			type: Array,
			default: () => []
		},
		htmlDropdownMode: {
			type: Boolean,
			default: false
		},
		hideOnScroll: {
			type: Boolean,
			default: false
		},
		valueSelector: {
			type: String,
			default: ".value"
		},
		dropdownItemKey: {
			type: String,
			default: "text"
		},
		hideButton: {
			type: Boolean,
			default: false
		},
		rippleEffect: {
			type: Boolean,
			default: true
		}
	},

	data() {
		return {
			active: false,
			ripples: []
		}
	},

	computed: {
		type() {
			return this.to ? "router-link" : "button";
		},

		value() {
			return this.$slots?.default[0]?.elm?.parentNode?.querySelector(this.valueSelector);
		},

		rawHTML() {
			const string = new DOMParser()
				.parseFromString(this.vText || this.vHtml, "text/html").body.childNodes[0];
				
			this.$nextTick(() => {
				this.$refs.text.insertBefore(string, null);
			});
		},

		hasDropdown() {
			return this.dropdown.length || this.$slots.dropdown;
		}
	},

	methods: {
		/**
		 * Add prefix to each word in string
		 * 
		 * @param {String} string
		 * @param {String} prefix
		 * 
		 * @returns {String}
		 */
		prefix(string, prefix) {
			return (string ?? "").split(" ").map(word => `${ prefix }-${ word }`).join(" ");
		},

		/**
		 * Set value in button
		 * 
		 * @param {Object|String}
		 */
		setValue(item) {
			if (item && this.value) {
				/* Set value in valueSelector */
				this.value.innerHTML = item[this.dropdownItemKey] || item.text || item;
			}
		},

		/**
		 * Start ripple animation
		 * 
		 * @param {Event} e
		 */
		animateRipple(e) {
			if (!this.rippleEffect || this.disabled) return;

			const 
				el = this.$refs.button.$el || this.$refs.button,
				pos = el?.getBoundingClientRect();

			if (e && pos) {
				this.ripples.push({
					x: e.clientX - pos.left,
					y: e.clientY - pos.top,
					show: true
				});
			}
		},

		/**
		 * End ripple animation
		 * 
		 * @param {Number} i
		 */
		rippleEnd(i) {
			this.ripples[i].show = false;
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

		document.body.addEventListener("scroll", () => {
			if (this.hideOnScroll && this.active) {
				this.active = false;
			};
		}, { passive: true });
	}
}