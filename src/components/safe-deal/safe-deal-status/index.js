export default {
	name: "SafeDealStatus",

	props: {
		items: {
			type: Array,
			default: () => []
		},
		currentStatus: {
			type: String,
			default: ""
		},
	},

	data() {
		return {
		}
	},

	computed: {
	},

	methods: {
		statusChecked(item) {
			const 
				itemIndex = this.items.indexOf(item),
				currentIndex = this.items.indexOf(this.currentStatus);

			return (currentIndex >= 0 && itemIndex <= currentIndex);
		},

		nextStatusChecked(item) {
			const 
				itemIndex = this.items.indexOf(item),
				currentIndex = this.items.indexOf(this.currentStatus);

			return (currentIndex >= 0 && itemIndex + 1 <= currentIndex);
		},

		statusNegative(item) {
			return item.includes("b");
		},

		statusIcon(item) {
			return (
				this.statusChecked(item) 
				? (this.statusNegative(item) ? "times-circle" : "check-circle" )
				: "circle" 
			);
		},

		statusTitle(item) {
			return this.$t(`safeDealLabels.status_${item}`);
		},
	},
}