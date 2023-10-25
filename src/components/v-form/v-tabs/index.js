export default {
	name: "Vtabs",

	props: {
		tabset: [
			/* {
				tabId: "tab-1",
				title: "Tab 1",
				active: true
			} */
		],
		vType: String
	},

	data() {
		return {
			active: null
		}
	},

	computed: {
		selected() {
			return this.tabset.filter(t => t.active)[0]?.tabId || this.tabset[0]?.tabId;
		}
	},

	methods: {
		change(e, index) {
			e.preventDefault();
			this.active = this.tabset[index].tabId;
		}
	},
}