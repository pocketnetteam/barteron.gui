export default {
	name: "Vswitch",

	props: {
		id: { type: [String, Array], default: () => [] },
		name: { type: [String, Array], default: () => [] },
		type: { type: [String, Array], default: () => [] },
		value: { type: [String, Array], default: () => [] },
		selected: { type: [String, Array], default: () => [] },
		label: { type: [String, Array], default: () => [] },
		
		vSize: String,
		vType: String
	},

	computed: {
		switches() {
			return this.getSwitches([this.id, this.name, this.type, this.value, this.selected, this.label]);
		}
	},

	data() {
		return {
			inputs: [],
			active: this.selected
		}
	},

	watch: {
		checked(value) {
			this.active = value;
		}
	},

	methods: {
		/**
		 * Convert String to Array
		 * 
		 * @param {String} param
		 */
		toArray(param) {
			return Array.isArray(param) ? param : [param];
		},

		/**
		 * Build switch list from props
		 * 
		 * @param {Array} switches
		 * 
		 * @returns {Object[]}
		 */
		getSwitches(switches) {
			const sw = Object.keys(this.$props).reduce((o, p) => {
				o[p] = this.toArray(this[p]);

				return o;
			}, {});

			return switches
				.map(m => this.toArray(m))
				.sort((a, b) => a.length > b.length ? -1 : (a.length < b.length ? 1 : 0))[0]
				.reduce((a, v, i) => {
					a.push(
						/* Generate sw keys */
						Object.keys(sw).reduce((o, k) => {
							if (k === "type" || k === "name") o[k] = sw[k][i] ?? sw[k][sw[k].length - 1];
							else if (k === "id") {
								const idData = {};
								["name", "type"].forEach(key => {
									idData[key] = sw[key][i] ?? sw[key][sw[key].length - 1];
								})
								o[k] = `${idData["name"]}-${idData["type"]}-${i}`;
							}
							else o[k] = sw[k][i] ?? null
	
							return o;
						}, {})
					);

					return a;
				}, []);
		},

		/**
		 * Change radio state
		 * 
		 * @param {Event} e
		 */
		change(e) {
			this.$emit("change", e.target.value, e);
		},

		/**
		 * Serialize fields
		 * 
		 * @method serialize
		 * 
		 * @returns {Array}
		 */
		serialize() {
			return [ ...this.active ];
		}
	},

	mounted() {
		/* Create real-time computed property */
		this.inputs = new Proxy(this.$refs.fields, {
			get(target, index) {
				return target?.[index];
			}
		});
	}
}