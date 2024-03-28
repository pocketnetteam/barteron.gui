export default {
	name: "Sidebar",

	props: {
		icon: {
			type: Object,
			default: () => {}
		}
	},

	data() {
		return {
			active: false
		}
	},

	methods: {
		/**
		 * Toggle active class
		 */
		toggle() {
			this.active = !this.active;
		}
	}
}