export default {
	name: "Aside",

	props: {
		icon: {
			type: Object,
			default: () => {}
		},
		hideOnScroll: {
			type: Boolean,
			default: false
		},
		hideOnOutsideClick: {
			type: Boolean,
			default: false
		},
	},

	data() {
		return {
			active: false,
			marked: false,
		}
	},

	methods: {
		/**
		 * Toggle active class
		 */
		toggle() {
			this.active = !this.active;
		},

		mark(value) {
			this.marked = value;
		},

		addEventListeners() {
			document.body.addEventListener("click", (event) => {
				if (this.hideOnOutsideClick && this.active) {
					const 
						target = event.target,
						thisEl = this.$el,
						appEl = document.getElementById("app"),
						elements = "header,main,footer"
							.split(",")
							.map(m => document.getElementById(m));

					const 
						thisElContains = (thisEl === target || thisEl?.contains(target)),
						otherElContain = elements.some(f => (f === target || f?.contains(target))),
						isAppEl = (appEl === target);

					const needHide = (otherElContain || isAppEl) && !(thisElContains);
					if (needHide) {
						this.active = false;
					}
				};
			}, { passive: true, capture: true });

			document.body.addEventListener("scroll", () => {
				if (this.hideOnScroll && this.active) {
					this.active = false;
				};
			}, { passive: true });
		},
	},

	mounted() {
		this.addEventListeners();
	},
}