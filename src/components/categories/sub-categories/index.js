export default {
	name: "SubCategories",

	props: {
		items: {
			type: Array,
			default: () => []
		},
		visible: {
			type: Number,
			default: 4
		},
		open: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			expanded: this.open,
		}
	},

	computed: {
		count() {
			return this.items.length - this.visible;
		}
	},

	methods: {
		toggle() {
			this.expanded = !this.expanded;
		}
	}
}