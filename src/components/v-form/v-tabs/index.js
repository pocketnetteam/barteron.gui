export default {
	name: "Vtabs",

	props: {
		tabset: [
			/* {
				tabId: "tab-1",
				title: "Tab 1",
				visible: true,
				active: true,
				disabled: false
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
		 * Get only accessible tabs
		 * 
		 * @returns {Array}
		 */
		tabs() {
			return this.tabset.filter(tab => tab.hasOwnProperty("visible") ? tab.visible : true);
		},

		/**
		 * Get only selected tabs
		 * 
		 * @returns {Array}
		 */
		selected() {
			return this.tabs.filter(t => t.active && !t.disabled)[0]?.tabId || this.tabs[0]?.tabId;
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

			const active = this.tabs[index].tabId;

			if (this.tabs[index].disabled) return;
			if (!this.hashTabs) this.active = active;

			this.$emit("change", active);
		}
	}
}