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