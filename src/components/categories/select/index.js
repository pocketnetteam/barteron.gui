import Loader from "@/components/loader/index.vue";

var debouncedSearch;

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

	computed: {
		/**
		 * List of categories
		 * 
		 * @returns {Array}
		 */
		list() {
			return this.expanded?.children?.length ? this.expanded.children : this.root;
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
				.map(id => ({ ...this.categories.items[id] }));
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
			let   pid = this.categories.items[item?.id ?? item]?.parent;
			const list = [];

			if (current) pid = item?.id;

			while(pid) {
				const parent = this.categories.items[pid];
				
				if (parent?.id) list.unshift(parent);

				pid = parent?.parent;
			}

			pid = null;

			return list;
		},

		/**
		 * Search in categories event
		 * 
		 * @param {Event} e
		 * 
		 * @returns {Void}
		 */
		searchEvent(e) {
			if (e?.keyCode === 13) e.preventDefault();
			if (
				e?.type === "click" 
				|| e?.type === "input" 
			) {
					this.input = this.$refs.search?.inputs?.[0];
					this.query = (this.input?.value || "").toLowerCase();
		
					debouncedSearch();
			}
		},

		/**
		 * Search in categories
		 * 
		 * @returns {Void}
		 */
		search() {
			// this.searching = true;
			this.results = [];

			if (this.query?.length) {
				/* Fist version of search */
				/*this.importChildren(Object.keys(this.categories.items)).forEach(item => {
					const value = this.$t(item.name).toLowerCase();

					if (value.includes(this.query)) {
						this.results.push({ ...item, history: this.getParents(item) });
					}
				}); */

				/* Second version of search */
				this.root.map(r => ({ ...r })).forEach(item => this.recursiveSearch(item));
			} 
			
			this.changed = this.query?.length;
			// setTimeout(() => this.searching = false, 1);
		},

		/**
		 * Clear search field
		 * 
		 * @returns {Void}
		 */
		clearEvent() {
			debouncedSearch?.cancel();
			this.clear();
			this.input?.focus?.();
		},

		/**
		 * Recursively search in item and all children
		 * All children results will be in item.matched
		 * matched param only for inner usage
		 * 
		 * Collect all direct and children matches to results array
		 * 
		 * @param {Object} item
		 * @param {Array} matched
		 */
		recursiveSearch(item, matched) {
			const value = this.$t(item.name).toLowerCase();

			/* Search in item */
			if (value.includes(this.query)) {
				if (!matched) matched = item.matched = [];
				else matched.push(item);
			}

			/* Search in item children */
			if (item.children?.length) {
				item.children = this.importChildren(item.children);

				for (const child of item.children) {
					this.recursiveSearch(child, matched);
				}
			}

			/* Push item to results */
			if (item.matched) {
				this.results.push({ ...item, history: item.matched });
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
		 * Expand selected item
		 * 
		 * @param {Number|String} id
		 */
		expand(id) {
			const
				item = this.categories.items[id],
				parent = this.categories.items[item?.parent];

			if (item?.id) {
				this.expanded = {
					...item,
					history: this.getParents(item, true),
					children: (() => {
						if (item.children?.length) {
							/* If item have children */
							return this.importChildren(item.children);
						} else if (parent?.children?.length) {
							/* If item haven't children, show list from parent */
							return this.importChildren(parent.children);
						} else {
							/* Show root categories */
							return [...this.root];
						}
					})()
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
			const needSelect = this.expanded && !(this.isMarked(this.expanded?.id));
			if (needSelect) {
				this.$emit('selected', this.expanded?.id);
			}
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
		/**
		 * Watch for value changes
		 * 
		 * @param {Number|String} id
		 */
		value(id) {
			this.expand(id);
		}
	},

	mounted() {
		this.root = this.importChildren(
			Object.entries(this.categories.items || {})
				.filter(f => !f[1].parent)
				.sort((a, b) => a[1].order - b[1].order)
				.map(m => m[0])
		);

		if (this.value) this.expand(this.value);

		debouncedSearch = this.debounce(() => this.search(), 500);
	},

	beforeDestroy() {
		debouncedSearch?.cancel();
		debouncedSearch = null;
	},
}