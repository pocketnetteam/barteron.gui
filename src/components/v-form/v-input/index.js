export default {
	name: "Vinput",

	props: {
		id: { type: [String, Array], default: () => [] },
		name: { type: [String, Array], default: () => [] },
		type: { type: [String, Array], default: () => [] },
		readonly: { type: [String, Array], default: () => [] },
		min: { type: [Number, String, Array], default: () => [] },
		max: { type: [Number, String, Array], default: () => [] },
		placeholder: { type: [String, Array], default: () => [] },
		list: { type: [String, Array], default: () => [] },
		value: { type: [Number, String, Array], default: () => [] },

		vSize: String,
	},

	data() {
		return {
			inputs: []
		}
	},

	computed:{
		/**
		 * Make object with inputs attributes
		 * 
		 * @returns {Object[]}
		 */
		attrs() {
			return this.getAttrs([this.id, this.name, this.type, this.placeholder, this.value]);
		}
	},

	methods: {
		/**
		 * Convert String to Array
		 * 
		 * @param {String} param
		 * 
		 * @returns {Array}
		 */
		toArray(param) {
			return Array.isArray(param) ? param : [param];
		},

		/**
		 * Build input list from props
		 * 
		 * @param {Array} inputs
		 * 
		 * @returns {Object}
		 */
		getAttrs(inputs) {
			const input = Object.keys(this.$props).reduce((o, p) => {
				o[p] = this.toArray(this[p]);

				return o;
			}, {});

			return inputs
				.map(m => this.toArray(m))
				.sort((a, b) => a.length > b.length ? -1 : (a.length < b.length ? 1 : 0))[0]
				.reduce((a, v, i) => {
					a.push(
						/* Generate input keys */
						Object.keys(input).reduce((o, k) => {
							if (k === "type") o[k] = this.getType(input[k][i] ?? input[k][input[k].length - 1]);
							else if (["min", "max"].includes(k)) o[k] = input[k][i] ?? input[k][input[k].length - 1];
							else o[k] = input[k][i] ?? null
	
							return o;
						}, {})
					);

					return a;
				}, []);
		},

		/**
		 * Get input type
		 * 
		 * @param {String}
		 * 
		 * @returns {String}
		 */
		getType(type) {
			switch(type) {
				case "minmax": return "number";
				default: return type;
			}
		},

		/**
		 * Emit event to parent
		 * 
		 * @param {String} type
		 * @param {Event} e
		 * @param {Number} index
		 */
		emit(type, e, index) {
			this.$emit(type, e, this.fields?.[index] ?? e.target);
		}
	},

	mounted() {
		/* Create real-time computed property */
		this.inputs = new Proxy(this.$refs.fields, {
			get(target, index) {
				return target?.[index];
			}
		});
	},
}