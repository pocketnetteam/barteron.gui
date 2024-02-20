export default {
	name: "Vtabs",

	props: {
		tabset: [
			/* {
				tabId: "tab-1",
				title: "Tab 1",
				visible: true,
				active: true
			} */
		],
		vType: String,

		/*
			Ignore active state on click and follow tab active state
			use @change handler to update route state with new #hash
		*/
		hashTabs: Boolean
	},

	data() {
		return {
			active: null
		}
	},

	computed: {
		/**
		 * Get only visible tabs
		 * 
		 * @returns {Array}
		 */
		tabs() {
			return this.tabset.filter(tab => tab.hasOwnProperty("visble") ? tab.visible : true);
		},

		/**
		 * Get only selected tabs
		 * 
		 * @returns {Array}
		 */
		selected() {
			return this.tabset.filter(t => t.active)[0]?.tabId || this.tabset[0]?.tabId;
		}
	},

	methods: {
		/**
		 * Change handler
		 * 
		 * @param {MouseEvent} e
		 * @param {Number} index
		 */
		change(e, index) {
			e.preventDefault();
			const active = this.tabset[index].tabId;
			if (!this.hashTabs) this.active = active;
			this.$emit("change", active);
		}
	}
}