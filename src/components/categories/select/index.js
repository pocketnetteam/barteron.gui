import Loader from "@/components/loader/index.vue";

export default {
	name: "Select",

	components: {
		Loader
	},

	props: {
		/**
		 * Categories ids that you
		 * want to be highlighted
		 */
		marked: {
			type: Array,
			default: () => []
		},

		value: {
			type: [Number, String],
			default: null
		}
	},

	data() {
		return {
			visible: false,

			root: [],
			expanded: false,
			input: {},
			query: "",
			changed: false,
			searching: false,
			results: []
		}
	},

	methods: {
		/**
		 * Show
		 */
		show() {
			this.clear().visible = true;
		},

		/**
		 * Hide
		 */
		hide() {
			this.visible = false;
		},

		/**
		 * Import children list
		 * 
		 * @param {Array[String]} ids 
		 */
		importChildren(ids) {
			return ids
				.filter(id => this.categories.items[id]/*  && this.$te(this.categories.items[id].name) */)
				.map(id => this.categories.items[id]);
		},

		/**
		 * Get parents of item
		 * 
		 * @param {Object} item
		 * @param {Boolean} current
		 * 
		 * @returns {Array}
		 */
		getParents(item, current) {
			let pid = item.parent;
			const list = [];

			if (current) pid = item.id;

			while(pid) {
				const parent = this.categories.items[pid];
				
				if (parent?.id) list.unshift(parent);

				pid = parent?.parent;
			}

			pid = null;

			return list;
		},

		/**
		 * Search in categories
		 * 
		 * @returns {Void}
		 */
		search(e) {
			if (e?.keyCode === 13) e.preventDefault();
			if (e?.type === "click" || e?.type === "keydown" && e?.keyCode === 13) {
				if (this.changed) return this.clear();

				this.input = this.$refs.search?.inputs?.[0];
				this.query = (this.input?.value || "").toLowerCase();
				this.searching = true;
				this.changed = true;
				this.results = [];
	
				if (this.query?.length) {
					this.results = [];
					this.importChildren(Object.keys(this.categories.items)).forEach(item => {
						const value = this.$t(item.name).toLowerCase();
	
						if (value.includes(this.query)) {
							this.results.push({ ...item, history: this.getParents(item) });
						}
					});
	
					setTimeout(() => this.searching = false, 1);
				}
	
				if (this.input) this.input.blur();
			}
		},

		/**
		 * Wrap matches in <mark>
		 * 
		 * @param {String} text
		 * 
		 * @returns {String}
		 */
		highlightMatches(text) {
			return text.replace(new RegExp(this.query, "ig"), match => {
				return `<mark>${ match }</mark>${ match.replace(match, '') }`;
			});
		},

		/**
		 * Clear search results
		 * 
		 * @returns {@Select}
		 */
		clear() {
			this.query = "";
			this.changed = false;
			this.searching = false;
			this.results = [];

			return this;
		},

		/**
		 * Input change event
		 */
		change() {
			this.input = this.$refs.search?.inputs?.[0];
			this.changed = this.input?.value?.length && this.query === this.input?.value.toLowerCase();
		},

		/**
		 * Expand selected item
		 * 
		 * @param {Number|String} id
		 */
		expand(id) {
			const item = this.categories.items[id];

			if (item?.id) {
				this.expanded = {
					...item,
					history: this.getParents(item, true),
					children: this.importChildren(item.children || [])
				}
	
				this.clear();
			} else {
				this.expanded = false;
			}
		},

		/**
		 * Select item
		 */
		select() {
			this.$emit('selected', this.expanded?.id);
			this.hide();
			this.expanded = false;
		},

		/**
		 * Check if given id in marked list
		 * 
		 * @param {Number|String} id
		 * 
		 * @returns {Boolean}
		 */
		isMarked(id) {
			return this.marked.some(d => Number(d) === Number(id));
		}
	},

	watch: {
		value(id) {
			if (this.categories.items[id]) this.expand(id);
		}
	},

	mounted() {
		this.root = this.importChildren(
			Object.keys(this.categories.items || []).filter(
				id => !this.categories.items[id].parent
			)
		);
	}
}