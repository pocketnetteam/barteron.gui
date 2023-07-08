export default {
	name: "Vtabs",

	props: {
		tabset: [
			/* {
				tabId: "tab-1",
				title: "Tab 1"
			} */
		],
		vType: String
	},

	data() {
		return {
			active: this.tabset[
				this.tabset.filter(t => t.active)[0] || 0
			].tabId
		}
	},

	methods: {
		change(e, index) {
			e.preventDefault();
			this.active = this.tabset[index].tabId;
		}
	},
}