export default {
	name: "Aside",

	props: {
		icon: {
			type: Object,
			default: () => {}
		}
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
		}
	}
}